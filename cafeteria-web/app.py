from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    Response
)

from flask import flash

from flask import send_file
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

from openpyxl import Workbook

from functools import wraps

from config import Config
from services.api import ApiService

app = Flask(__name__)
app.config.from_object(Config)


@app.template_filter("media_url")
def media_url(path):
    """Resuelve archivos servidos por la API sin depender de localhost."""
    if not path:
        return ""
    path = str(path)
    if path.startswith(("http://", "https://", "data:")):
        return path
    return f"{Config.API_URL.rstrip('/')}/{path.lstrip('/')}"

ROLE_PRESENTATION = {
    "administrador": {
        "etiqueta": "Administrador",
        "css_class": "administrador"
    },
    "mesero": {
        "etiqueta": "Mesero",
        "css_class": "mesero"
    },
    "cocina": {
        "etiqueta": "Cocinero",
        "css_class": "cocina"
    },
    "caja": {
        "etiqueta": "Caja",
        "css_class": "caja"
    }
}


@app.route("/")
def index():

    if "token" in session:
        return redirect(inicio_por_rol())

    return render_template("login.html")


def inicio_por_rol():
    """Página de inicio según el rol del usuario en sesión."""
    rol = session.get("rol")
    if rol == "administrador":
        return url_for("dashboard")
    if rol == "cocina":
        return url_for("panel_cocina")
    if rol == "caja":
        return url_for("panel_caja")
    return url_for("panel_mesas")


def requiere_rol(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if session.get("rol") not in roles:
                return redirect(url_for("index"))
            return f(*args, **kwargs)
        return decorated
    return decorator


@app.route("/login", methods=["GET", "POST"])
def login():
    if "token" in session:
        return redirect(inicio_por_rol())

    if request.method == "GET":
        return render_template("login.html")

    username = request.form.get("username")
    if username is None:
        username = request.form.get("correo")

    password = request.form.get("password")

    if not username or not password:
        return render_template(
            "login.html",
            error="No llegaron los datos del formulario."
        )

    respuesta = ApiService.login(
        username,
        password
    )

    if respuesta is None:
        return render_template(
            "login.html",
            error="No se pudo conectar con la API."
        )

    if respuesta.status_code != 200:
        return render_template(
            "login.html",
            error="Correo o contraseña incorrectos."
        )

    datos = respuesta.json()

    session["token"] = datos["access_token"]
    session["usuario"] = datos["usuario"]
    session["rol"] = datos["rol"]

    return redirect(inicio_por_rol())

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if "token" not in session:
            return redirect(url_for("login"))

        return f(*args, **kwargs)

    return decorated


@app.route("/cocina")
@login_required
@requiere_rol("administrador", "cocina")
def panel_cocina():
    return render_template(
        "cocina.html",
        pedidos=ApiService.obtener_pedidos_cocina(session["token"]),
        usuario=session["usuario"],
        rol=session["rol"]
    )


@app.route("/cocina/pedidos/<int:id_pedido>/<accion>", methods=["POST"])
@login_required
@requiere_rol("administrador", "cocina")
def actualizar_pedido_cocina(id_pedido, accion):
    if accion not in ("preparar", "listo"):
        flash("Acción de cocina no válida.", "danger")
        return redirect(url_for("panel_cocina"))
    respuesta = ApiService.actualizar_estado_cocina(
        session["token"], id_pedido, accion
    )
    if respuesta is not None and respuesta.status_code == 200:
        flash("Estado del pedido actualizado.", "success")
    else:
        flash(obtener_mensaje_api(respuesta, "No se pudo actualizar el pedido."), "danger")
    return redirect(url_for("panel_cocina"))


@app.route("/cocina/pedidos/<int:id_pedido>/demora", methods=["POST"])
@login_required
@requiere_rol("administrador", "cocina")
def demora_pedido_cocina(id_pedido):
    respuesta = ApiService.reportar_demora_cocina(
        session["token"], id_pedido, request.form.get("nota", "").strip()
    )
    if respuesta is not None and respuesta.status_code == 200:
        flash("Demora reportada.", "success")
    else:
        flash(obtener_mensaje_api(respuesta, "No se pudo reportar la demora."), "danger")
    return redirect(url_for("panel_cocina"))


@app.route("/caja")
@login_required
@requiere_rol("administrador", "caja")
def panel_caja():
    return render_template(
        "caja.html",
        pedidos=ApiService.obtener_pedidos_caja(session["token"]),
        usuario=session["usuario"],
        rol=session["rol"]
    )


@app.route("/caja/pedidos/<int:id_pedido>/cobrar", methods=["POST"])
@login_required
@requiere_rol("administrador", "caja")
def cobrar_pedido_caja(id_pedido):
    metodo = request.form.get("metodo_pago", "")
    datos = {"metodo_pago": metodo}
    monto = request.form.get("monto_recibido", "").strip()
    referencia = request.form.get("referencia_pago", "").strip()
    if monto:
        datos["monto_recibido"] = monto
    if referencia:
        datos["referencia_pago"] = referencia
    respuesta = ApiService.cobrar_pedido_caja(session["token"], id_pedido, datos)
    if respuesta is not None and respuesta.status_code == 200:
        flash("Pago registrado y mesa liberada.", "success")
    else:
        flash(obtener_mensaje_api(respuesta, "No se pudo registrar el pago."), "danger")
    return redirect(url_for("panel_caja"))


@app.route("/mesas", methods=["GET", "POST"])
@login_required
@requiere_rol("administrador", "mesero")
def panel_mesas():
    if request.method == "POST":
        if session.get("rol") != "administrador":
            flash("Solo el administrador puede agregar mesas.", "danger")
            return redirect(url_for("panel_mesas"))

        datos = {
            "numero": request.form.get("numero", type=int),
            "capacidad": request.form.get("capacidad", type=int),
            "estado": request.form.get("estado", "Libre")
        }
        respuesta = ApiService.crear_mesa(session["token"], datos)
        if respuesta is not None and respuesta.status_code == 200:
            flash("Mesa agregada correctamente.", "success")
        else:
            flash(obtener_mensaje_api(respuesta, "No se pudo agregar la mesa."), "danger")
        return redirect(url_for("panel_mesas"))

    mesas = ApiService.obtener_mesas(session["token"])
    estadisticas = {
        "total": len(mesas),
        "libres": sum(mesa.get("estado") == "Libre" for mesa in mesas),
        "ocupadas": sum(mesa.get("estado") == "Ocupada" for mesa in mesas),
        "reservadas": sum(mesa.get("estado") == "Reservada" for mesa in mesas)
    }
    return render_template(
        "mesas.html",
        mesas=mesas,
        estadisticas=estadisticas,
        usuario=session["usuario"],
        rol=session["rol"]
    )


@app.route("/mesas/<int:id_mesa>/editar", methods=["POST"])
@login_required
@requiere_rol("administrador")
def editar_mesa(id_mesa):
    datos = {
        "numero": request.form.get("numero", type=int),
        "capacidad": request.form.get("capacidad", type=int),
        "estado": request.form.get("estado", "Libre")
    }
    respuesta = ApiService.actualizar_mesa(session["token"], id_mesa, datos)
    if respuesta is not None and respuesta.status_code == 200:
        flash("Mesa actualizada correctamente.", "success")
    else:
        flash(obtener_mensaje_api(respuesta, "No se pudo actualizar la mesa."), "danger")
    return redirect(url_for("panel_mesas"))


@app.route("/mesas/<int:id_mesa>/eliminar", methods=["POST"])
@login_required
@requiere_rol("administrador")
def eliminar_mesa(id_mesa):
    respuesta = ApiService.eliminar_mesa(session["token"], id_mesa)
    if respuesta is not None and respuesta.status_code == 200:
        flash("Mesa eliminada correctamente.", "success")
    else:
        flash(obtener_mensaje_api(respuesta, "No se pudo eliminar la mesa."), "danger")
    return redirect(url_for("panel_mesas"))


def obtener_mensaje_api(respuesta, mensaje_predeterminado):
    """Convierte los errores de FastAPI en mensajes aptos para la interfaz."""
    if respuesta is None:
        return "No se pudo conectar con la API."

    try:
        detalle = respuesta.json().get("detail")
    except (ValueError, AttributeError):
        return mensaje_predeterminado

    if isinstance(detalle, str):
        return detalle

    if isinstance(detalle, list):
        nombres = {
            "nombre": "Nombre del producto",
            "descripcion": "Descripción",
            "precio": "Precio",
            "stock": "Stock",
            "id_categoria": "Categoría",
            "imagen": "Imagen del producto"
        }

        mensajes = []
        for error in detalle:
            ubicacion = error.get("loc", [])
            campo = ubicacion[-1] if ubicacion else "dato"
            etiqueta = nombres.get(campo, str(campo).replace("_", " ").title())

            if error.get("type") == "missing":
                mensajes.append(f"El campo «{etiqueta}» es obligatorio.")
            else:
                mensajes.append(f"{etiqueta}: {error.get('msg', 'valor inválido')}.")

        return " ".join(mensajes)

    return mensaje_predeterminado


def obtener_catalogo_roles(token):
    """Obtiene de la API los cuatro roles operativos y prepara sus etiquetas."""
    roles = []

    for rol in ApiService.obtener_roles(token):
        presentacion = ROLE_PRESENTATION.get(rol.get("nombre"))
        if not presentacion:
            continue

        roles.append({
            **rol,
            **presentacion
        })

    roles.sort(key=lambda rol: rol["id_rol"])
    return roles

@app.route("/dashboard")
@login_required
def dashboard():
    if session.get("rol") != "administrador":
        return redirect(inicio_por_rol())

    estadisticas = ApiService.obtener_dashboard(
        session["token"]
    )

    if estadisticas and estadisticas.get("token_expirado"):
        session.clear()
        return redirect(url_for("index"))

    estadisticas_base = {
        "usuarios": 0,
        "productos": 0,
        "categorias": 0,
        "stock_bajo": 0,
        "ganancias": 0.0,
        "ordenes": 0,
        "mesas_ocupadas": 0,
        "gastos": 0.0,
        "gastos_detalle": [],
        "insumos": []
    }

    api_disponible = isinstance(estadisticas, dict)

    if api_disponible:
        estadisticas_base.update(estadisticas)

    for campo in (
        "usuarios",
        "productos",
        "categorias",
        "stock_bajo",
        "ganancias",
        "ordenes",
        "mesas_ocupadas",
        "gastos"
    ):
        estadisticas_base[campo] = estadisticas_base.get(campo) or 0

    estadisticas_base["gastos_detalle"] = (
        estadisticas_base.get("gastos_detalle") or []
    )
    estadisticas_base["insumos"] = estadisticas_base.get("insumos") or []

    estadisticas = estadisticas_base

    if api_disponible:
        productos_dashboard = ApiService.obtener_productos(
            session["token"]
        )

        pedidos_reporte = ApiService.obtener_reporte_pedidos(
            session["token"]
        )
    else:
        productos_dashboard = []
        pedidos_reporte = []

    pedidos_dashboard = [
        {
            "fecha": pedido.get("fecha"),
            "total": pedido.get("total", 0),
            "estado": pedido.get("estado")
        }
        for pedido in pedidos_reporte
    ]

    return render_template(
        "dashboard.html",
        usuario=session["usuario"],
        rol=session["rol"],
        estadisticas=estadisticas,
        productos_dashboard=productos_dashboard,
        pedidos_dashboard=pedidos_dashboard
    )

@app.route("/usuarios", methods=["GET", "POST"])
@login_required
def usuarios():
    error = None
    roles = obtener_catalogo_roles(session["token"])
    roles_por_id = {
        rol["id_rol"]: rol
        for rol in roles
    }

    if request.method == "POST":

        nombre = request.form.get("nombre_completo")
        email = request.form.get("email")
        password = request.form.get("password")
        id_rol_form = request.form.get("id_rol")

        try:
            id_rol = int(id_rol_form)
        except (TypeError, ValueError):
            id_rol = None

        if id_rol not in roles_por_id:
            error = "Selecciona uno de los roles disponibles."

        if error is None:
            datos = {

                "nombre_completo": nombre,
                "email": email,
                "password": password,
                "id_rol": id_rol

            }

            respuesta = ApiService.crear_usuario(
                session["token"],
                datos
            )

            if respuesta is not None and respuesta.status_code == 200:
                return redirect(url_for("usuarios"))

            error = obtener_mensaje_api(
                respuesta,
                "No se pudo crear el usuario."
            )

    lista_usuarios = ApiService.obtener_usuarios(
        session["token"]
    )

    return render_template(
            "usuarios.html",
            usuarios=lista_usuarios,
            usuario=session["usuario"],
            rol=session["rol"],
            roles=roles,
            roles_por_id=roles_por_id,
            error=error
        )

@app.route("/usuarios/eliminar/<int:id>")
@login_required
def eliminar_usuario(id):

    ApiService.eliminar_usuario(
        session["token"],
        id
    )

    return redirect(url_for("usuarios"))

@app.route("/usuarios/editar/<int:id>", methods=["GET","POST"])
@login_required
def editar_usuario(id):
    error = None
    roles = obtener_catalogo_roles(session["token"])
    roles_por_id = {
        rol["id_rol"]: rol
        for rol in roles
    }
    usuario = ApiService.obtener_usuario(
        session["token"],
        id
    )

    if request.method == "POST":
        id_rol_form = request.form.get("id_rol")

        try:
            id_rol = int(id_rol_form)
        except (TypeError, ValueError):
            id_rol = None

        datos = {

            "nombre_completo": request.form["nombre_completo"],
            "email": request.form["email"],
            "id_rol": id_rol,
            "activo": request.form.get("activo") == "true",
            "password": request.form.get("password") or None

        }

        if id_rol not in roles_por_id:
            error = "Selecciona uno de los roles disponibles."
        else:
            respuesta = ApiService.actualizar_usuario(
                session["token"],
                id,
                datos
            )

            if respuesta is not None and respuesta.status_code == 200:
                return redirect(url_for("usuarios"))

            error = obtener_mensaje_api(
                respuesta,
                "No se pudo actualizar el usuario."
            )

        if usuario:
            usuario.update({
                "nombre_completo": datos["nombre_completo"],
                "email": datos["email"],
                "id_rol": datos["id_rol"],
                "activo": datos["activo"]
            })

    return render_template(
        "editar_usuario.html",
        usuario_editar=usuario,
        rol_usuario=roles_por_id.get(usuario.get("id_rol")) if usuario else None,
        roles=roles,
        error=error
    )

@app.route("/productos", methods=["GET", "POST"])
@login_required
def productos():

    error = None

    nombre = request.args.get("nombre")
    categoria = request.args.get("categoria")
    activo = request.args.get("activo")
    stock = request.args.get("stock")

    if request.method == "POST":

        descripcion = request.form.get("descripcion", "").strip()

        if not descripcion:
            error = "La descripción del producto es obligatoria."

        else:

            datos = {

                "nombre": request.form["nombre"],
                "descripcion": descripcion,
                "precio": request.form["precio"],
                "stock": request.form["stock"],
                "activo": request.form["activo"],
                "id_categoria": request.form["id_categoria"]

            }

            imagen = request.files["imagen"]

            respuesta = ApiService.crear_producto(

                session["token"],
                datos,
                imagen

            )

            if respuesta is not None and respuesta.status_code == 200:

                return redirect(url_for("productos"))

            error = obtener_mensaje_api(
                respuesta,
                "No fue posible registrar el producto. Revisa los datos ingresados."
            )

    productos = ApiService.obtener_productos(

        session["token"],

        nombre,

        categoria if categoria else None,

        activo if activo != "" else None,

        stock if stock else None

    )

    categorias = ApiService.obtener_categorias(
        session["token"]
    )

    return render_template(

        "productos.html",

        productos=productos,

        categorias=categorias,

        usuario=session["usuario"],

        rol=session["rol"],

        error=error

    )

@app.route("/productos/editar/<int:id_producto>", methods=["GET", "POST"])
@login_required
def editar_producto(id_producto):

    if request.method == "POST":

        # Obtener el producto actual
        producto = ApiService.obtener_producto(
            session["token"],
            id_producto
        )

        imagen = request.files.get("imagen")

        datos = {

            "nombre": request.form["nombre"],
            "descripcion": request.form["descripcion"],
            "precio": request.form["precio"],
            "stock": request.form["stock"],
            "activo": request.form["activo"],
            "id_categoria": request.form["id_categoria"]

        }

        ApiService.actualizar_producto(
            session["token"],
            id_producto,
            datos,
            imagen
        )

        return redirect(url_for("productos"))

    producto = ApiService.obtener_producto(
        session["token"],
        id_producto
    )

    categorias = ApiService.obtener_categorias(
        session["token"]
    )

    return render_template(
        "editar_producto.html",
        producto=producto,
        categorias=categorias
    )

@app.route("/productos/eliminar/<int:id_producto>")
@login_required
def eliminar_producto(id_producto):

    ApiService.eliminar_producto(

        session["token"],
        id_producto

    )

    return redirect(url_for("productos"))

@app.route("/categorias", methods=["GET", "POST"])
@login_required
def categorias():

    error = None

    if request.method == "POST":

        datos = {

            "nombre": request.form["nombre"],
            "descripcion": request.form["descripcion"]

        }

        respuesta = ApiService.crear_categoria(

            session["token"],
            datos

        )

        if respuesta.status_code == 200:

            return redirect(url_for("categorias"))

        error = respuesta.text

    categorias = ApiService.obtener_categorias(
        session["token"]
    )

    return render_template(

        "categorias.html",

        categorias=categorias,

        usuario=session["usuario"],

        rol=session["rol"],

        error=error

    )

@app.route("/categorias/eliminar/<int:id_categoria>")
@login_required
def eliminar_categoria(id_categoria):

    respuesta = ApiService.eliminar_categoria(
        session["token"],
        id_categoria
    )

    if respuesta.status_code == 200:

        flash(
            "Categoría eliminada correctamente.",
            "success"
        )

    else:

        flash(
            respuesta.json()["detail"],
            "danger"
        )

    return redirect(url_for("categorias"))

@app.route("/gastos", methods=["GET", "POST"])
@login_required
@requiere_rol("administrador")
def gastos():

    error = None

    if request.method == "POST":

        monto = request.form.get("monto")
        categoria = request.form.get("categoria", "").strip()
        descripcion = request.form.get("descripcion", "").strip()
        metodo_pago = request.form.get("metodo_pago", "").strip()
        fecha = request.form.get("fecha", "").strip()

        if categoria == "__otro__":
            categoria = request.form.get("categoria_nueva", "").strip()

        try:
            monto_decimal = float(monto)
        except (TypeError, ValueError):
            monto_decimal = 0

        if monto_decimal <= 0:
            error = "El monto debe ser mayor a 0."
        elif len(categoria) < 2:
            error = "La categoría debe tener al menos 2 caracteres."
        elif len(descripcion) < 3:
            error = "La descripción debe tener al menos 3 caracteres."

        if error is None:

            datos = {
                "monto": round(monto_decimal, 2),
                "categoria": categoria,
                "descripcion": descripcion
            }

            if metodo_pago:
                datos["metodo_pago"] = metodo_pago

            if fecha:
                datos["fecha"] = f"{fecha}T12:00:00"

            respuesta = ApiService.crear_gasto(
                session["token"],
                datos
            )

            if respuesta is not None and respuesta.status_code == 201:

                flash("Gasto registrado correctamente.", "success")

                return redirect(url_for("gastos"))

            error = obtener_mensaje_api(
                respuesta,
                "No se pudo registrar el gasto."
            )

    categoria_filtro = request.args.get("categoria", "").strip()

    gastos = ApiService.obtener_gastos(
        session["token"],
        categoria=categoria_filtro
    )

    gastos_todos = ApiService.obtener_gastos(
        session["token"]
    )

    todas_categorias = sorted({
        gasto["categoria"]
        for gasto in gastos_todos
    })

    total_gastos = sum(
        float(gasto["monto"])
        for gasto in gastos
    )

    return render_template(

        "gastos.html",

        gastos=gastos,

        total_gastos=total_gastos,

        categorias_distintas=len(todas_categorias),
        metodos_distintos=len({
            gasto.get("metodo_pago")
            for gasto in gastos
            if gasto.get("metodo_pago")
        }),

        todas_categorias=todas_categorias,

        categoria_filtro=categoria_filtro,

        usuario=session["usuario"],

        rol=session["rol"],

        error=error

    )

@app.route("/gastos/editar/<int:id_gasto>", methods=["POST"])
@login_required
@requiere_rol("administrador")
def editar_gasto(id_gasto):

    monto = request.form.get("monto")
    categoria = request.form.get("categoria", "").strip()
    descripcion = request.form.get("descripcion", "").strip()
    metodo_pago = request.form.get("metodo_pago", "").strip()
    fecha = request.form.get("fecha", "").strip()

    if categoria == "__otro__":
        categoria = request.form.get("categoria_nueva", "").strip()

    try:
        monto_decimal = float(monto)
    except (TypeError, ValueError):
        monto_decimal = 0

    if monto_decimal <= 0:
        flash("El monto debe ser mayor a 0.", "danger")
        return redirect(url_for("gastos"))

    datos = {
        "monto": round(monto_decimal, 2),
        "categoria": categoria,
        "descripcion": descripcion
    }

    if metodo_pago:
        datos["metodo_pago"] = metodo_pago

    if fecha:
        datos["fecha"] = f"{fecha}T12:00:00"

    respuesta = ApiService.actualizar_gasto(
        session["token"],
        id_gasto,
        datos
    )

    if respuesta is not None and respuesta.status_code == 200:

        flash("Gasto actualizado correctamente.", "success")

    else:

        flash(
            obtener_mensaje_api(
                respuesta,
                "No se pudo actualizar el gasto."
            ),
            "danger"
        )

    return redirect(url_for("gastos"))

@app.route("/gastos/eliminar/<int:id_gasto>")
@login_required
@requiere_rol("administrador")
def eliminar_gasto(id_gasto):

    respuesta = ApiService.eliminar_gasto(
        session["token"],
        id_gasto
    )

    if respuesta is not None and respuesta.status_code == 200:

        flash("Gasto eliminado correctamente.", "success")

    else:

        flash(
            obtener_mensaje_api(
                respuesta,
                "No se pudo eliminar el gasto."
            ),
            "danger"
        )

    return redirect(url_for("gastos"))

@app.route("/pedidos", methods=["GET", "POST"])
@login_required
@requiere_rol("administrador", "mesero")
def pedidos():
    error = None

    if request.method == "POST":

        id_mesa_raw = request.form.get("id_mesa", "").strip()
        if not id_mesa_raw.isdigit():
            error = "El número de mesa debe ser un valor numérico válido."
        else:
            datos = {
                "id_mesa": int(id_mesa_raw)
            }

            respuesta = ApiService.crear_pedido(
                session["token"],
                datos
            )

            if respuesta is None or respuesta.status_code != 200:
                error = obtener_mensaje_api(respuesta, "No se pudo crear el pedido.")
            else:
                return redirect(url_for("pedidos"))

    pedidos = ApiService.obtener_pedidos(
        session["token"]
    )
    mesas = [
        mesa for mesa in ApiService.obtener_mesas(session["token"])
        if mesa.get("estado") == "Libre"
    ]

    return render_template(
        "pedidos.html",
        pedidos=pedidos,
        mesas=mesas,
        usuario=session["usuario"],
        rol=session["rol"],
        error=error
    )

@app.route("/pedidos/eliminar/<int:id_pedido>")
@login_required
def eliminar_pedido(id_pedido):

    ApiService.eliminar_pedido(
        session["token"],
        id_pedido
    )

    return redirect(url_for("pedidos"))

@app.route("/reportes")
@login_required
def reportes():

    datos = ApiService.obtener_reportes(
        session["token"]
    )

    if not datos:

        datos = {
            "usuarios":0,
            "productos":0,
            "categorias":0,
            "pedidos":0,
            "ventas":0,
            "poco_stock":0,
            "productos_vendidos":0
        }

    if datos.get("token_expirado"):

        session.clear()

        return redirect(url_for("index"))

    return render_template(

        "reportes.html",

        reporte=datos,

        usuario=session["usuario"],

        rol=session["rol"]

    )

@app.route("/reportes/productos")
@login_required
def reporte_productos():

    nombre = request.args.get("nombre")
    id_categoria = request.args.get("id_categoria")
    activo = request.args.get("activo")
    stock_minimo = request.args.get("stock_minimo")

    productos = ApiService.obtener_reporte_productos(

        session["token"],

        nombre,

        id_categoria,

        activo,

        stock_minimo

    )

    categorias = ApiService.obtener_categorias(
        session["token"]
    )

    return render_template(

        "reporte_productos.html",

        productos=productos,

        categorias=categorias,

        usuario=session["usuario"],

        rol=session["rol"]

    )

@app.route("/reportes/pdf")
@login_required
def exportar_pdf():

    respuesta = ApiService.descargar_pdf(
        session["token"]
    )

    return Response(

        respuesta.content,

        mimetype="application/pdf",

        headers={
            "Content-Disposition":
            "attachment; filename=reporte.pdf"
        }

    )


@app.route("/reportes/excel")
@login_required
def exportar_excel():

    respuesta = ApiService.descargar_excel(
        session["token"]
    )

    return Response(

        respuesta.content,

        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        headers={
            "Content-Disposition":
            "attachment; filename=reporte.xlsx"
        }

    )

@app.route("/pedidos/<int:id_pedido>", methods=["GET","POST"])
@login_required
def detalle_pedido(id_pedido):

    error = None

    if request.method == "POST":

        # Cambiar estado
        if request.form.get("accion") == "estado":

            ApiService.cambiar_estado_pedido(

                session["token"],
                id_pedido,
                request.form["estado"]

            )

            return redirect(
                url_for(
                    "detalle_pedido",
                    id_pedido=id_pedido
                )
            )

        # Agregar producto
        elif request.form.get("accion") == "producto":

            datos = {

                "id_pedido": id_pedido,

                "id_producto": int(request.form["id_producto"]),

                "cantidad": int(request.form["cantidad"])

            }

            respuesta = ApiService.agregar_producto_pedido(

                session["token"],
                datos

            )

            if respuesta.status_code != 200:

                error = respuesta.text

            else:

                return redirect(
                    url_for(
                        "detalle_pedido",
                        id_pedido=id_pedido
                    )
                )

    detalle = ApiService.obtener_detalle_pedido(
        session["token"],
        id_pedido
    )

    productos = ApiService.obtener_productos(
        session["token"]
    )

    pedido = ApiService.obtener_pedido(
        session["token"],
        id_pedido
    )

    return render_template(
        "detalle_pedido.html",
        pedido=pedido,
        detalle=detalle,
        productos=productos,
        error=error
    )

@app.route("/categorias/editar/<int:id>", methods=["POST"])
@login_required
def editar_categoria(id):

    datos = {
        "nombre": request.form["nombre"],
        "descripcion": request.form["descripcion"]
    }

    ApiService.actualizar_categoria(
        session["token"],
        id,
        datos
    )

    return redirect(url_for("categorias"))

@app.route("/detalle/eliminar/<int:id_detalle>/<int:id_pedido>")
@login_required
def eliminar_detalle(id_detalle,id_pedido):

    ApiService.eliminar_detalle(
        session["token"],
        id_detalle
    )

    return redirect(
        url_for(
            "detalle_pedido",
            id_pedido=id_pedido
        )
    )

@app.route("/reportes/productos/pdf")
@login_required
def descargar_pdf_productos():

    params = request.args.to_dict()

    respuesta = ApiService.descargar_pdf_productos(
        session["token"],
        params
    )

    return Response(

        respuesta.content,

        mimetype="application/pdf",

        headers={

            "Content-Disposition":
            "attachment; filename=productos.pdf"

        }

    )

@app.route("/reportes/productos/excel")
@login_required
def descargar_excel_productos():

    params = request.args.to_dict()

    respuesta = ApiService.descargar_excel_productos(
        session["token"],
        params
    )

    return Response(

        respuesta.content,

        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        headers={

            "Content-Disposition":
            "attachment; filename=productos.xlsx"

        }

    )

@app.route("/reportes/pedidos")
@login_required
def reporte_pedidos():

    pedidos = ApiService.obtener_reporte_pedidos(

        session["token"],

        request.args.get("estado"),

        request.args.get("id_mesa"),

        request.args.get("fecha_inicio"),

        request.args.get("fecha_fin")

    )

    mesas = ApiService.obtener_mesas(
        session["token"]
    )

    return render_template(

        "reporte_pedidos.html",

        pedidos=pedidos,

        mesas=mesas,

        usuario=session["usuario"],

        rol=session["rol"]

    )

@app.route("/reportes/inventario")
@login_required
def reporte_inventario():

    inventario = ApiService.obtener_reporte_inventario(

        session["token"],

        request.args.get("categoria"),

        request.args.get("stock_bajo")

    )

    categorias = ApiService.obtener_categorias(
        session["token"]
    )

    return render_template(

        "reporte_inventario.html",

        inventario=inventario,

        categorias=categorias,

        usuario=session["usuario"],

        rol=session["rol"]

    )

@app.route("/reportes/pedidos/pdf")
@login_required
def descargar_pdf_pedidos():

    params = request.args.to_dict()

    respuesta = ApiService.descargar_pdf_pedidos(
        session["token"],
        params
    )

    return Response(

        respuesta.content,

        mimetype="application/pdf",

        headers={
            "Content-Disposition":
            "attachment; filename=pedidos.pdf"
        }

    )


@app.route("/reportes/pedidos/excel")
@login_required
def descargar_excel_pedidos():

    params = request.args.to_dict()

    respuesta = ApiService.descargar_excel_pedidos(
        session["token"],
        params
    )

    return Response(

        respuesta.content,

        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        headers={
            "Content-Disposition":
            "attachment; filename=pedidos.xlsx"
        }

    )

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
