"""Prueba destructiva controlada del flujo operativo contra una API desplegada."""

import os
import sys

import requests


BASE_URL = os.getenv("SMOKE_API_URL", "http://127.0.0.1:8000").rstrip("/")
WEB_URL = os.getenv("SMOKE_WEB_URL", "").rstrip("/")
TIMEOUT = 90


def required(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Falta {name}.")
    return value


def api_session(email, password):
    session = requests.Session()
    response = session.post(
        f"{BASE_URL}/auth/login",
        data={"username": email, "password": password},
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    session.headers["Authorization"] = f"Bearer {response.json()['access_token']}"
    return session


def expect(response, *codes):
    if response.status_code not in codes:
        raise AssertionError(
            f"{response.request.method} {response.url}: "
            f"{response.status_code} {response.text[:1000]}"
        )
    return response


def main():
    mesero = api_session("mesero@cafeteria.local", required("SMOKE_MESERO_PASSWORD"))
    cocina = api_session("cocina@cafeteria.local", required("SMOKE_COCINA_PASSWORD"))
    caja = api_session("caja@cafeteria.local", required("SMOKE_CAJA_PASSWORD"))
    admin = api_session("admin@cafeteria.local", required("SMOKE_ADMIN_PASSWORD"))

    for session, paths in (
        (mesero, ("/pedidos/", "/notificaciones/", "/preferencias/")),
        (cocina, ("/cocina/pedidos", "/notificaciones/", "/insumos/")),
        (caja, ("/caja/pedidos", "/caja/historial", "/gastos/")),
        (admin, ("/actividad/", "/promociones/", "/compras/")),
    ):
        for path in paths:
            expect(session.get(f"{BASE_URL}{path}", timeout=TIMEOUT), 200)
            print(f"OK módulo {path}")

    mesas = expect(mesero.get(f"{BASE_URL}/mesas/", timeout=TIMEOUT), 200).json()
    productos = expect(
        mesero.get(f"{BASE_URL}/productos/", params={"activo": True}, timeout=TIMEOUT),
        200,
    ).json()
    libres = [mesa for mesa in mesas if mesa["estado"] == "Libre"]
    disponibles = [p for p in productos if p["activo"] and (p["stock"] or 0) > 0]
    if len(libres) < (2 if WEB_URL else 1) or not disponibles:
        raise AssertionError("Se requiere al menos una mesa libre y un producto con stock.")

    mesa_movil = libres[0]
    producto = disponibles[0]
    creado = expect(
        mesero.post(
            f"{BASE_URL}/pedidos/completo",
            json={
                "id_mesa": mesa_movil["id_mesa"],
                "observaciones": "Smoke test móvil/API",
                "productos": [{"id_producto": producto["id_producto"], "cantidad": 1}],
            },
            timeout=TIMEOUT,
        ),
        201,
    ).json()
    pedido_id = creado["id_pedido"]
    print(f"OK pedido móvil #{pedido_id}")

    expect(cocina.put(f"{BASE_URL}/cocina/pedidos/{pedido_id}/preparar", timeout=TIMEOUT), 200)
    expect(cocina.put(f"{BASE_URL}/cocina/pedidos/{pedido_id}/listo", timeout=TIMEOUT), 200)
    expect(
        caja.post(
            f"{BASE_URL}/caja/pedidos/{pedido_id}/cobrar",
            json={"metodo_pago": "Efectivo", "monto_recibido": "1000.00"},
            timeout=TIMEOUT,
        ),
        200,
    )
    mesa_final = expect(
        mesero.get(f"{BASE_URL}/mesas/{mesa_movil['id_mesa']}", timeout=TIMEOUT),
        200,
    ).json()
    assert mesa_final["estado"] == "Libre", mesa_final
    print("OK cocina, caja y liberación de mesa")

    if WEB_URL:
        web = requests.Session()
        expect(
            web.post(
                f"{WEB_URL}/login",
                data={
                    "username": "mesero@cafeteria.local",
                    "password": required("SMOKE_MESERO_PASSWORD"),
                },
                timeout=TIMEOUT,
            ),
            200,
        )
        antes = {p["id_pedido"] for p in expect(mesero.get(f"{BASE_URL}/pedidos/", timeout=TIMEOUT), 200).json()}
        expect(
            web.post(
                f"{WEB_URL}/pedidos",
                data={"id_mesa": libres[1]["id_mesa"]},
                timeout=TIMEOUT,
            ),
            200,
        )
        despues = expect(mesero.get(f"{BASE_URL}/pedidos/", timeout=TIMEOUT), 200).json()
        nuevos = [p for p in despues if p["id_pedido"] not in antes]
        if len(nuevos) != 1:
            raise AssertionError(f"La web no creó exactamente un pedido: {nuevos}")
        pedido_web = nuevos[0]["id_pedido"]
        expect(
            web.post(
                f"{WEB_URL}/pedidos/{pedido_web}",
                data={
                    "accion": "producto",
                    "id_producto": producto["id_producto"],
                    "cantidad": 1,
                },
                timeout=TIMEOUT,
            ),
            200,
        )
        detalles = expect(
            mesero.get(f"{BASE_URL}/detalle-pedido/pedido/{pedido_web}", timeout=TIMEOUT),
            200,
        ).json()
        if len(detalles) != 1:
            raise AssertionError(f"La web no agregó el producto: {detalles}")
        expect(mesero.delete(f"{BASE_URL}/pedidos/{pedido_web}", timeout=TIMEOUT), 200)
        print(f"OK pedido web #{pedido_web} con producto (limpiado)")

    print("SMOKE E2E COMPLETO")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"SMOKE E2E FALLÓ: {exc}", file=sys.stderr)
        raise
