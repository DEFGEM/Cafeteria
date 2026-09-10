"""Puebla la BD con datos demo para todos los dominios del sistema.

Idempotente: crea solo lo que no existe y actualiza los datos base ya creados
por scripts/seed_mobile_demo.py. No modifica usuarios ni contraseñas.

Uso:
    .venv/bin/python scripts/seed_demo_completo.py
"""
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models import (
    Categoria,
    Compra,
    DetalleCompra,
    EventoAuditoria,
    Gasto,
    Insumo,
    Mesa,
    MovimientoInventario,
    Notificacion,
    NotificacionLectura,
    PreferenciaNegocio,
    Producto,
    Promocion,
    Usuario,
)

# ----------------------------------------------------------------------------
# Datos base (iguales a seed_mobile_demo.py, para mantener consistencia)
# ----------------------------------------------------------------------------

CATEGORIAS = [
    {"nombre": "Bebidas", "descripcion": "Bebidas calientes y frías"},
    {"nombre": "Panadería", "descripcion": "Pan y productos de panadería"},
    {"nombre": "Comidas", "descripcion": "Platillos preparados"},
    {"nombre": "Postres", "descripcion": "Postres y repostería"},
]

PRODUCTOS = [
    ("Cafe Americano", "Café americano de grano", "35.00", 50, "Bebidas"),
    ("Cafe Latte", "Espresso con leche vaporizada", "42.00", 40, "Bebidas"),
    ("Frape de chocolate", "Frappé de chocolate con crema", "55.00", 30, "Bebidas"),
    ("Pan dulce", "Pan dulce horneado del día", "25.00", 60, "Panadería"),
    ("Concha", "Concha de panadería", "18.00", 45, "Panadería"),
    ("Sandwich de jamón", "Sandwich con jamón y queso", "65.00", 25, "Comidas"),
    ("Tamal de elote", "Tamal dulce de elote", "38.00", 30, "Comidas"),
    ("Brownie", "Brownie de chocolate", "30.00", 35, "Postres"),
]

MESAS = [
    (1, 2),
    (2, 4),
    (3, 4),
    (4, 6),
]

# ----------------------------------------------------------------------------
# Datos de dominios avanzados
# ----------------------------------------------------------------------------

INSUMOS = [
    {"nombre": "Cafe molido", "descripcion": "Grano molido para preparar café", "categoria": "Bebidas", "unidad": "kg", "stock": Decimal("8.000"), "minimo": Decimal("2.000")},
    {"nombre": "Leche", "descripcion": "Leche entera de vaca", "categoria": "Bebidas", "unidad": "L", "stock": Decimal("12.000"), "minimo": Decimal("5.000")},
    {"nombre": "Azucar", "descripcion": "Azúcar refinada", "categoria": "Bebidas", "unidad": "kg", "stock": Decimal("15.000"), "minimo": Decimal("5.000")},
    {"nombre": "Chocolate en polvo", "descripcion": "Chocolate para bebidas y postres", "categoria": "Bebidas", "unidad": "kg", "stock": Decimal("6.000"), "minimo": Decimal("3.000")},
    {"nombre": "Harina", "descripcion": "Harina de trigo", "categoria": "Panadería", "unidad": "kg", "stock": Decimal("20.000"), "minimo": Decimal("8.000")},
    {"nombre": "Vasos desechables", "descripcion": "Vasos de 12 onzas", "categoria": "Envases", "unidad": "piezas", "stock": Decimal("300.000"), "minimo": Decimal("100.000")},
    {"nombre": "Servilletas", "descripcion": "Servilletas de papel", "categoria": "Papelería", "unidad": "piezas", "stock": Decimal("500.000"), "minimo": Decimal("200.000")},
    {"nombre": "Jamon", "descripcion": "Jamón de pavo", "categoria": "Carnes frías", "unidad": "kg", "stock": Decimal("3.000"), "minimo": Decimal("1.000")},
]

COMPRAS = [
    {
        "folio": "CMP-0001",
        "proveedor": "Distribuidora del Valle",
        "estado": "Recibida",
        "observaciones": "Compra inicial de insumos básicos",
        "detalles": [
            ("Cafe molido", "10.000", "350.00"),
            ("Leche", "20.000", "24.50"),
            ("Azucar", "10.000", "32.00"),
        ],
    },
    {
        "folio": "CMP-0002",
        "proveedor": "Proveedora Norte",
        "estado": "Recibida",
        "observaciones": "Materiales desechables",
        "detalles": [
            ("Vasos desechables", "200.000", "1.60"),
            ("Servilletas", "300.000", "0.60"),
        ],
    },
]

GASTOS = [
    {
        "categoria": "Servicios",
        "descripcion": "Servicio de electricidad del mes",
        "monto": "850.00",
        "metodo_pago": "Efectivo",
    },
    {
        "categoria": "Limpieza",
        "descripcion": "Artículos de limpieza",
        "monto": "320.00",
        "metodo_pago": "Tarjeta",
    },
    {
        "categoria": "Servicios",
        "descripcion": "Agua purificada",
        "monto": "150.00",
        "metodo_pago": "Efectivo",
    },
]

PROMOCIONES = [
    {
        "nombre": "Cafe del día 10%",
        "descripcion": "10% de descuento en café americano",
        "tipo": "Porcentaje",
        "valor": "10.00",
        "producto": "Cafe Americano",
        "vigencia_dias": 30,
    },
    {
        "nombre": "Descuento latte",
        "descripcion": "15 pesos de descuento en café latte",
        "tipo": "Monto",
        "valor": "15.00",
        "producto": "Cafe Latte",
        "vigencia_dias": 15,
    },
]

NOTIFICACIONES = [
    {
        "titulo": "Nuevo menú de temporada",
        "mensaje": "El menú de temporada ya está disponible en el módulo de marketing.",
        "tipo": "marketing",
        "rol_destino": "mesero",
    },
    {
        "titulo": "Stock bajo de insumos",
        "mensaje": "Revisa el inventario: el jamón está por debajo del mínimo.",
        "tipo": "inventario",
        "rol_destino": "cocina",
    },
]

PREFERENCIAS = [
    {
        "clave": "nombre_negocio",
        "valor": "Cafetería Central",
        "descripcion": "Nombre comercial del negocio",
    },
    {
        "clave": "horario",
        "valor": "07:00 - 20:00",
        "descripcion": "Horario de atención",
    },
    {
        "clave": "moneda",
        "valor": "MXN",
        "descripcion": "Moneda utilizada en el sistema",
    },
    {
        "clave": "impuesto",
        "valor": 0.16,
        "descripcion": "Impuesto aplicado a las ventas",
    },
]


def get_usuario(db, email):
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_or_create_categorias(db):
    por_nombre = {}
    for datos in CATEGORIAS:
        categoria = (
            db.query(Categoria)
            .filter(Categoria.nombre == datos["nombre"])
            .first()
        )
        if categoria:
            categoria.descripcion = datos["descripcion"]
        else:
            categoria = Categoria(**datos)
            db.add(categoria)
            db.flush()
        por_nombre[datos["nombre"]] = categoria
    return por_nombre


def get_or_create_productos(db, categorias):
    for nombre, descripcion, precio, stock, nombre_categoria in PRODUCTOS:
        producto = db.query(Producto).filter(Producto.nombre == nombre).first()
        if producto:
            producto.descripcion = descripcion
            producto.precio = Decimal(precio)
            producto.stock = stock
            producto.activo = True
            producto.id_categoria = categorias[nombre_categoria].id_categoria
        else:
            producto = Producto(
                nombre=nombre,
                descripcion=descripcion,
                precio=Decimal(precio),
                stock=stock,
                activo=True,
                id_categoria=categorias[nombre_categoria].id_categoria,
            )
            db.add(producto)
            db.flush()


def get_or_create_mesas(db):
    for numero, capacidad in MESAS:
        mesa = db.query(Mesa).filter(Mesa.numero == numero).first()
        if mesa:
            mesa.capacidad = capacidad
            mesa.estado = "Libre"
        else:
            db.add(Mesa(numero=numero, capacidad=capacidad, estado="Libre"))


def get_or_create_insumos(db):
    por_nombre = {}
    for datos in INSUMOS:
        insumo = db.query(Insumo).filter(Insumo.nombre == datos["nombre"]).first()
        if insumo:
            insumo.descripcion = datos["descripcion"]
            insumo.categoria = datos["categoria"]
            insumo.unidad_medida = datos["unidad"]
            insumo.stock_minimo = datos["minimo"]
            insumo.activo = True
        else:
            insumo = Insumo(
                nombre=datos["nombre"],
                descripcion=datos["descripcion"],
                categoria=datos["categoria"],
                unidad_medida=datos["unidad"],
                stock_actual=datos["stock"],
                stock_minimo=datos["minimo"],
                activo=True,
            )
            db.add(insumo)
            db.flush()
        por_nombre[datos["nombre"]] = insumo
    return por_nombre


def get_or_create_compras(db, insumos, usuario):
    for datos in COMPRAS:
        compra = (
            db.query(Compra)
            .filter(Compra.folio == datos["folio"])
            .first()
        )
        if compra:
            continue

        compra = Compra(
            proveedor=datos["proveedor"],
            folio=datos["folio"],
            fecha=datetime.now() - timedelta(days=10),
            estado=datos["estado"],
            total=Decimal("0.00"),
            observaciones=datos["observaciones"],
            recibido_en=datetime.now() - timedelta(days=10),
            id_usuario=usuario.id_usuario,
        )
        db.add(compra)
        db.flush()

        total = Decimal("0.00")
        for nombre_insumo, cantidad, costo in datos["detalles"]:
            insumo = insumos[nombre_insumo]
            cantidad_dec = Decimal(cantidad)
            costo_dec = Decimal(costo)
            subtotal = cantidad_dec * costo_dec
            total += subtotal

            db.add(
                DetalleCompra(
                    cantidad=cantidad_dec,
                    costo_unitario=costo_dec,
                    subtotal=subtotal,
                    id_compra=compra.id_compra,
                    id_insumo=insumo.id_insumo,
                )
            )
            anterior = insumo.stock_actual
            posterior = anterior + cantidad_dec
            insumo.stock_actual = posterior
            db.add(
                MovimientoInventario(
                    tipo="Entrada",
                    cantidad=cantidad_dec,
                    stock_anterior=anterior,
                    stock_posterior=posterior,
                    motivo=f"Compra {datos['folio']} recibida",
                    referencia=datos["folio"],
                    id_insumo=insumo.id_insumo,
                    id_usuario=usuario.id_usuario,
                    id_compra=compra.id_compra,
                )
            )
        compra.total = total


def get_or_create_gastos(db, usuario):
    for datos in GASTOS:
        existe = (
            db.query(Gasto)
            .filter(Gasto.descripcion == datos["descripcion"])
            .first()
        )
        if existe:
            continue
        db.add(
            Gasto(
                categoria=datos["categoria"],
                descripcion=datos["descripcion"],
                monto=Decimal(datos["monto"]),
                fecha=datetime.now() - timedelta(days=5),
                metodo_pago=datos["metodo_pago"],
                activo=True,
                id_usuario=usuario.id_usuario,
            )
        )


def get_or_create_promociones(db, usuario):
    ahora = datetime.now()
    for datos in PROMOCIONES:
        existe = (
            db.query(Promocion)
            .filter(Promocion.nombre == datos["nombre"])
            .first()
        )
        if existe:
            continue
        producto = (
            db.query(Producto)
            .filter(Producto.nombre == datos["producto"])
            .first()
        )
        db.add(
            Promocion(
                nombre=datos["nombre"],
                descripcion=datos["descripcion"],
                tipo=datos["tipo"],
                valor=Decimal(datos["valor"]),
                fecha_inicio=ahora - timedelta(days=1),
                fecha_fin=ahora + timedelta(days=datos["vigencia_dias"]),
                activo=True,
                id_producto=producto.id_producto if producto else None,
                id_usuario=usuario.id_usuario,
            )
        )


def get_or_create_notificaciones(db, usuario_creador, usuarios):
    for datos in NOTIFICACIONES:
        existe = (
            db.query(Notificacion)
            .filter(Notificacion.titulo == datos["titulo"])
            .first()
        )
        if existe:
            continue
        notificacion = Notificacion(
            titulo=datos["titulo"],
            mensaje=datos["mensaje"],
            tipo=datos["tipo"],
            rol_destino=datos["rol_destino"],
            id_usuario_creador=usuario_creador.id_usuario,
        )
        db.add(notificacion)
        db.flush()

        destino = usuarios.get(datos["rol_destino"])
        if destino:
            db.add(
                NotificacionLectura(
                    id_notificacion=notificacion.id_notificacion,
                    id_usuario=destino.id_usuario,
                )
            )


def get_or_create_preferencias(db, usuario):
    for datos in PREFERENCIAS:
        preferencia = (
            db.query(PreferenciaNegocio)
            .filter(PreferenciaNegocio.clave == datos["clave"])
            .first()
        )
        if preferencia:
            preferencia.valor = datos["valor"]
        else:
            db.add(
                PreferenciaNegocio(
                    clave=datos["clave"],
                    valor=datos["valor"],
                    descripcion=datos["descripcion"],
                    id_usuario_actualizacion=usuario.id_usuario,
                )
            )


def crear_eventos_auditoria(db, usuario):
    existe = (
        db.query(EventoAuditoria)
        .filter(EventoAuditoria.accion == "carga_datos_demo")
        .first()
    )
    if existe:
        return
    db.add(
        EventoAuditoria(
            modulo="seed",
            accion="carga_datos_demo",
            entidad="sistema",
            descripcion="Carga inicial de datos demo para todos los dominios",
            severidad="info",
            id_usuario=usuario.id_usuario,
        )
    )


def main():
    db = SessionLocal()
    try:
        admin = get_usuario(db, "admin@cafeteria.local")
        mesero = get_usuario(db, "mesero@cafeteria.local")
        cocina = get_usuario(db, "cocina@cafeteria.local")
        if not admin or not mesero or not cocina:
            raise RuntimeError(
                "Ejecuta primero scripts/seed_mobile_demo.py para crear los usuarios."
            )

        categorias = get_or_create_categorias(db)
        get_or_create_productos(db, categorias)
        get_or_create_mesas(db)
        insumos = get_or_create_insumos(db)
        get_or_create_compras(db, insumos, admin)
        get_or_create_gastos(db, admin)
        get_or_create_promociones(db, admin)
        get_or_create_notificaciones(db, admin, {"mesero": mesero, "cocina": cocina})
        get_or_create_preferencias(db, admin)
        crear_eventos_auditoria(db, admin)

        db.commit()
        print("Datos demo completos listos para los casos de prueba.")
    finally:
        db.close()


if __name__ == "__main__":
    main()