"""Genera la tarjeta de credenciales exigida en el Tercer Parcial.

Produce un PDF con:
1. Hoja resumen tamano carta con los 4 usuarios del sistema.
2. Cuatro tarjetas recortables (caracteristicas de tarjeta ~85x55 mm).

Uso:
    .venv/bin/python scripts/generar_tarjeta_credenciales.py
"""
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# --- Configuracion modificable -----------------------------------------------
IP_ACCESO = "192.168.0.17"
URL_WEB = f"http://{IP_ACCESO}:5000"
URL_API = f"http://{IP_ACCESO}:8000"
EMPRESA = "Cafetería"

OUTPUT = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "credenciales"
    / "tarjeta_credenciales.pdf"
)

ROLES = [
    {
        "rol": "Mesero",
        "correo": "mesero@cafeteria.local",
        "password": "Mesero123!",
        "color": "#4a90d9",
    },
    {
        "rol": "Cocina",
        "correo": "cocina@cafeteria.local",
        "password": "Cocina123!",
        "color": "#e67e22",
    },
    {
        "rol": "Caja",
        "correo": "caja@cafeteria.local",
        "password": "Caja123!",
        "color": "#27ae60",
    },
    {
        "rol": "Administrador",
        "correo": "admin@cafeteria.local",
        "password": "Admin123!",
        "color": "#8e44ad",
    },
]

PAGE_W, PAGE_H = letter  # 612 x 792 pt
MARGEN = 40

HEADERS = ("Rol", "Correo", "Contraseña")
ANCHOS = (120, 230, 120)


def dibujar_hoja_resumen(c: canvas.Canvas) -> None:
    c.setTitle("Credenciales de acceso - Cafetería")
    y = PAGE_H - 55

    c.setFillColor(HexColor("#2c3e50"))
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGEN, y, f"Credenciales de acceso · {EMPRESA}")
    y -= 18
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#7f8c8d"))
    c.drawString(
        MARGEN,
        y,
        "Tercer parcial · Arquitectura desacoplada Móvil + Web + API",
    )
    y -= 30

    x_ini = 55
    ancho_tabla = sum(ANCHOS)

    c.setFillColor(HexColor("#2c3e50"))
    c.setFont("Helvetica-Bold", 12)
    x = x_ini
    for titulo, ancho in zip(HEADERS, ANCHOS):
        c.drawString(x + 12, y - 18, titulo)
        x += ancho
    c.setStrokeColor(HexColor("#bdc3c7"))
    c.setLineWidth(0.6)
    c.rect(x_ini - 2, y - 42, ancho_tabla + 4, 42, stroke=1, fill=0)
    for i in range(1, len(HEADERS)):
        ix = x_ini - 2 + sum(ANCHOS[:i])
        c.line(ix, y, ix, y - 42)

    fila_y = y - 60
    for usuario in ROLES:
        c.setFillColor(HexColor(usuario["color"]))
        c.rect(
            x_ini - 2,
            fila_y - 36,
            ancho_tabla + 4,
            36,
            stroke=0,
            fill=1,
        )
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x_ini + 12, fila_y - 24, usuario["rol"])
        c.setFont("Helvetica", 12)
        c.drawString(x_ini + 12 + ANCHOS[0], fila_y - 24, usuario["correo"])
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x_ini + 12 + ANCHOS[0] + ANCHOS[1], fila_y - 24, usuario["password"])

        c.setStrokeColor(HexColor("#ecf0f1"))
        c.setLineWidth(0.8)
        x = x_ini - 2
        for ancho in ANCHOS[:-1]:
            x += ancho
            c.line(x, fila_y, x, fila_y - 36)
        fila_y -= 46

    y_baja = fila_y - 34
    c.setFillColor(HexColor("#2c3e50"))
    c.setFont("Helvetica", 10)
    c.drawString(MARGEN, y_baja, f"Acceso móvil (app):  {URL_API}")
    c.drawString(MARGEN, y_baja - 14, f"Acceso web (panel):  {URL_WEB}")
    c.setFillColor(HexColor("#7f8c8d"))
    c.setFont("Helvetica", 9)
    c.drawString(
        MARGEN,
        y_baja - 30,
        "Las mismas credenciales sirven para la aplicación móvil y para la web "
        "(misma API).",
    )


def dibujar_tarjeta(c, x, y, ancho, alto, usuario, numero) -> None:
    color = HexColor(usuario["color"])

    # Línea de corte punteada
    c.setStrokeColor(HexColor("#bdc3c7"))
    c.setDash(1, 3)
    c.setLineWidth(0.8)
    c.rect(x, y, ancho, alto, stroke=1, fill=0)
    c.setDash()

    # Tarjeta
    x0, y0 = x + 8, y + 8
    w0, h0 = ancho - 16, alto - 16
    c.setFillColor(HexColor("#fefefe"))
    c.roundRect(x0, y0, w0, h0, 6, stroke=0, fill=1)

    # Cabecera de color con el rol
    c.setFillColor(color)
    c.roundRect(
        x0, y0 + h0 - 44, w0, 44, 6, stroke=0, fill=1,
    )
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(
        x0 + 10, y0 + h0 - 36, f"{EMPRESA}"
    )
    c.setFont("Helvetica", 9)
    c.drawString(x0 + 10, y0 + h0 - 22, f"Credencial #{numero} · {usuario['rol']}")

    c.setFillColor(HexColor("#2c3e50"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x0 + 10, y0 + 56, "Correo:")
    c.drawString(x0 + 10, y0 + 32, "Contraseña:")
    c.setFont("Helvetica", 10)
    c.drawCentredString(x0 + w0 / 2, y0 + 56, usuario["correo"])
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x0 + w0 / 2, y0 + 32, usuario["password"])

    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#7f8c8d"))
    c.drawString(x0 + 10, y0 + 10, f"Web: {URL_WEB}")
    c.drawString(x0 + 10, y0, f"App: {URL_API}")


def dibujar_hoja_tarjetas(c: canvas.Canvas) -> None:
    ancho, alto = 241, 156  # ~85 x 55 mm
    x_ini = MARGEN
    y_top = PAGE_H - MARGEN

    c.setFillColor(HexColor("#2c3e50"))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(
        MARGEN,
        y_top - 25,
        "Tarjetas recortables de credenciales",
    )
    c.setFillColor(HexColor("#7f8c8d"))
    c.setFont("Helvetica", 9)
    c.drawString(
        MARGEN,
        y_top - 38,
        "Imprime en tamaño Carta y recorta cada tarjeta por la línea punteada.",
    )

    for i, usuario in enumerate(ROLES):
        fila, col = divmod(i, 2)
        x = x_ini + col * (ancho + 40)
        y = y_top - 70 - (alto + 40) * fila - alto
        dibujar_tarjeta(c, x, y, ancho, alto, usuario, i + 1)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=letter)
    dibujar_hoja_resumen(c)
    c.showPage()
    dibujar_hoja_tarjetas(c)
    c.showPage()
    c.save()
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    main()