import requests

from config import Config


class ApiService:

    @staticmethod
    def login(username, password):

        try:

            response = requests.post(
                f"{Config.API_URL}/auth/login",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "grant_type": "password",
                    "username": username,
                    "password": password
                }
            )

            return response

        except requests.exceptions.ConnectionError:

            return None
        
    @staticmethod
    def dashboard(token):

        response = requests.get(

            f"{Config.API_URL}/estadisticas/",

            headers={

                "Authorization":
                f"Bearer {token}"

            }

        )

        if response.status_code != 200:
            return None

        return response.json()
    
    @staticmethod
    def crear_usuario(token, datos):

        try:

            response = requests.post(

                f"{Config.API_URL}/usuarios/",

                json=datos,

                headers={

                    "Authorization": f"Bearer {token}"

                }

            )

            return response

        except requests.exceptions.ConnectionError:

            return None
        
    @staticmethod
    def obtener_usuarios(token):

        response = requests.get(
            f"{Config.API_URL}/usuarios/",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code == 200:
            return response.json()

        return []

    @staticmethod
    def obtener_roles(token):
        try:
            response = requests.get(
                f"{Config.API_URL}/roles/",
                headers={
                    "Authorization": f"Bearer {token}"
                },
                timeout=10
            )
        except requests.exceptions.RequestException:
            return []

        if response.status_code != 200:
            return []

        return response.json()


    @staticmethod
    def eliminar_usuario(token, id_usuario):

        return requests.delete(
            f"{Config.API_URL}/usuarios/{id_usuario}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
    
    @staticmethod
    def crear_producto(token, datos, imagen):

        files = {

            "imagen": (

                imagen.filename,

                imagen.stream,

                imagen.mimetype

            )

        }

        response = requests.post(

            f"{Config.API_URL}/productos/",

            headers={

                "Authorization": f"Bearer {token}"

            },

            data=datos,

            files=files

        )

        return response
    
    @staticmethod
    def eliminar_producto(token, id_producto):

        return requests.delete(

            f"{Config.API_URL}/productos/{id_producto}",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def obtener_categorias(token):

        response = requests.get(

            f"{Config.API_URL}/categorias/",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

        if response.status_code != 200:
            return []

        return response.json()
    
    @staticmethod
    def crear_categoria(token, datos):

        return requests.post(

            f"{Config.API_URL}/categorias/",

            json=datos,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def obtener_pedidos(token):

        response = requests.get(
            f"{Config.API_URL}/pedidos/",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code != 200:
            return []

        return response.json()
    
    @staticmethod
    def obtener_pedido(token, id_pedido):

        response = requests.get(

            f"{Config.API_URL}/pedidos/{id_pedido}",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

        if response.status_code != 200:
            return None

        return response.json()


    @staticmethod
    def crear_pedido(token, datos):

        return requests.post(
            f"{Config.API_URL}/pedidos/",
            json=datos,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )


    @staticmethod
    def eliminar_pedido(token, id_pedido):

        return requests.delete(
            f"{Config.API_URL}/pedidos/{id_pedido}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
    
    @staticmethod
    def obtener_dashboard(token):
        try:
            response = requests.get(
                f"{Config.API_URL}/dashboard/",
                headers={
                    "Authorization": f"Bearer {token}"
                },
                timeout=10
            )
        except requests.exceptions.RequestException:
            return None

        if response.status_code in (401, 403):
            return {"token_expirado": True}

        if response.status_code != 200:
            return None

        return response.json()
    
    @staticmethod
    def obtener_usuario(token, id_usuario):

        response = requests.get(
            f"{Config.API_URL}/usuarios/{id_usuario}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code != 200:
            return None

        return response.json()


    @staticmethod
    def actualizar_usuario(token, id_usuario, datos):

        return requests.put(
            f"{Config.API_URL}/usuarios/{id_usuario}",
            json=datos,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
    
    @staticmethod
    def obtener_productos(
        token,
        nombre=None,
        id_categoria=None,
        activo=None,
        stock_minimo=None
    ):

        params = {}

        if nombre:
            params["nombre"] = nombre

        if id_categoria:
            params["id_categoria"] = id_categoria

        if activo != "" and activo is not None:
            params["activo"] = activo

        if stock_minimo:
            params["stock_minimo"] = stock_minimo

        response = requests.get(

            f"{Config.API_URL}/productos/",

            headers={
                "Authorization": f"Bearer {token}"
            },

            params=params

        )

        if response.status_code != 200:
            return []

        return response.json()

    @staticmethod
    def obtener_mesas(token):

        try:
            response = requests.get(
                f"{Config.API_URL}/mesas/",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return []

        if response.status_code != 200:

            return []

        return response.json()

    @staticmethod
    def crear_mesa(token, datos):
        try:
            return requests.post(
                f"{Config.API_URL}/mesas/",
                json=datos,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return None

    @staticmethod
    def actualizar_mesa(token, id_mesa, datos):
        try:
            return requests.put(
                f"{Config.API_URL}/mesas/{id_mesa}",
                json=datos,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return None

    @staticmethod
    def eliminar_mesa(token, id_mesa):
        try:
            return requests.delete(
                f"{Config.API_URL}/mesas/{id_mesa}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return None

    @staticmethod
    def obtener_pedidos_cocina(token):
        try:
            response = requests.get(
                f"{Config.API_URL}/cocina/pedidos",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
            return response.json() if response.status_code == 200 else []
        except requests.exceptions.RequestException:
            return []

    @staticmethod
    def actualizar_estado_cocina(token, id_pedido, accion):
        try:
            return requests.put(
                f"{Config.API_URL}/cocina/pedidos/{id_pedido}/{accion}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return None

    @staticmethod
    def reportar_demora_cocina(token, id_pedido, nota):
        try:
            return requests.post(
                f"{Config.API_URL}/cocina/pedidos/{id_pedido}/demora",
                json={"nota": nota},
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return None

    @staticmethod
    def obtener_pedidos_caja(token):
        try:
            response = requests.get(
                f"{Config.API_URL}/caja/pedidos",
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
            return response.json() if response.status_code == 200 else []
        except requests.exceptions.RequestException:
            return []

    @staticmethod
    def cobrar_pedido_caja(token, id_pedido, datos):
        try:
            return requests.post(
                f"{Config.API_URL}/caja/pedidos/{id_pedido}/cobrar",
                json=datos,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
        except requests.exceptions.RequestException:
            return None
    
    @staticmethod
    def obtener_estadisticas_mesas(token):

        response = requests.get(

            f"{Config.API_URL}/mesas/estadisticas",

            headers={

                "Authorization":
                f"Bearer {token}"

            }

        )

        if response.status_code != 200:

            return {}

        return response.json()

    @staticmethod
    def obtener_producto(token, id_producto):

        response = requests.get(
            f"{Config.API_URL}/productos/{id_producto}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code != 200:
            return None

        return response.json()

    @staticmethod
    def actualizar_producto(token, id_producto, datos, imagen=None):

        headers = {
            "Authorization": f"Bearer {token}"
        }

        if imagen and imagen.filename:

            files = {
                "imagen": (
                    imagen.filename,
                    imagen.stream,
                    imagen.content_type
                )
            }

            response = requests.put(
                f"{Config.API_URL}/productos/{id_producto}",
                headers=headers,
                data=datos,
                files=files
            )

        else:

            response = requests.put(
                f"{Config.API_URL}/productos/{id_producto}",
                headers=headers,
                data=datos
            )

        return response
    
    @staticmethod
    def obtener_reportes(token):

        response = requests.get(

            f"{Config.API_URL}/reportes/",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

        if response.status_code == 401:

            return {

                "token_expirado": True

            }

        if response.status_code != 200:

            return {}

        return response.json()
    
    @staticmethod
    def descargar_pdf(token):

        return requests.get(

            f"{Config.API_URL}/reportes/pdf",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )


    @staticmethod
    def descargar_excel(token):

        return requests.get(

            f"{Config.API_URL}/reportes/excel",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def obtener_detalle_pedido(token, id_pedido):

        response = requests.get(

            f"{Config.API_URL}/detalle-pedido/pedido/{id_pedido}",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

        if response.status_code != 200:
            return []

        return response.json()


    @staticmethod
    def agregar_producto_pedido(token, datos):

        return requests.post(

            f"{Config.API_URL}/detalle-pedido/",

            json=datos,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )


    @staticmethod
    def eliminar_detalle(token, id_detalle):

        return requests.delete(

            f"{Config.API_URL}/detalle-pedido/{id_detalle}",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def cambiar_estado_pedido(token, id_pedido, estado):

        return requests.put(

            f"{Config.API_URL}/pedidos/{id_pedido}/estado",

            json={
                "estado": estado
            },

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def actualizar_categoria(token, id_categoria, datos):

        return requests.put(

            f"{Config.API_URL}/categorias/{id_categoria}",

            json=datos,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def eliminar_categoria(token, id_categoria):

        return requests.delete(

            f"{Config.API_URL}/categorias/{id_categoria}",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def obtener_reporte_productos(
        token,
        nombre=None,
        id_categoria=None,
        activo=None,
        stock_minimo=None
    ):

        params = {}

        if nombre:
            params["nombre"] = nombre

        if id_categoria:
            params["id_categoria"] = id_categoria

        if activo != "" and activo is not None:
            params["activo"] = activo

        if stock_minimo:
            params["stock_minimo"] = stock_minimo

        response = requests.get(

            f"{Config.API_URL}/reportes/productos",

            headers={
                "Authorization": f"Bearer {token}"
            },

            params=params

        )

        if response.status_code != 200:
            return []

        return response.json()
    
    @staticmethod
    def descargar_pdf_productos(token, params):

        return requests.get(

            f"{Config.API_URL}/reportes/productos/pdf",

            headers={

                "Authorization": f"Bearer {token}"

            },

            params=params

        )
    
    @staticmethod
    def descargar_excel_productos(token, params):

        return requests.get(

            f"{Config.API_URL}/reportes/productos/excel",

            headers={

                "Authorization": f"Bearer {token}"

            },

            params=params

        )
    
    @staticmethod
    def obtener_reporte_pedidos(

        token,

        estado=None,

        id_mesa=None,

        fecha_inicio=None,

        fecha_fin=None

    ):

        params = {}

        if estado:
            params["estado"] = estado

        if id_mesa:
            params["id_mesa"] = id_mesa

        if fecha_inicio:
            params["fecha_inicio"] = fecha_inicio

        if fecha_fin:
            params["fecha_fin"] = fecha_fin

        response = requests.get(

            f"{Config.API_URL}/reportes/pedidos",

            params=params,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

        if response.status_code != 200:
            return []

        return response.json()
    
    @staticmethod
    def descargar_pdf_pedidos(token, params):

        return requests.get(

            f"{Config.API_URL}/reportes/pedidos/pdf",

            params=params,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
    
    @staticmethod
    def descargar_excel_pedidos(token, params):

        return requests.get(

            f"{Config.API_URL}/reportes/pedidos/excel",

            params=params,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
        
    
    @staticmethod
    def obtener_reporte_inventario(

        token,

        categoria=None,

        stock_bajo=None

    ):

        params = {}

        if categoria:
            params["categoria"] = categoria

        if stock_bajo:
            params["stock_bajo"] = stock_bajo

        response = requests.get(

            f"{Config.API_URL}/reportes/inventario",

            headers={
                "Authorization": f"Bearer {token}"
            },

            params=params

        )

        if response.status_code != 200:
            return []

        return response.json()

    @staticmethod
    def obtener_gastos(token, categoria=None):

        params = {}

        if categoria:
            params["categoria"] = categoria

        response = requests.get(

            f"{Config.API_URL}/gastos/",

            params=params,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

        if response.status_code != 200:
            return []

        return response.json()

    @staticmethod
    def crear_gasto(token, datos):

        return requests.post(

            f"{Config.API_URL}/gastos/",

            json=datos,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

    @staticmethod
    def actualizar_gasto(token, id_gasto, datos):

        return requests.put(

            f"{Config.API_URL}/gastos/{id_gasto}",

            json=datos,

            headers={
                "Authorization": f"Bearer {token}"
            }

        )

    @staticmethod
    def eliminar_gasto(token, id_gasto):

        return requests.delete(

            f"{Config.API_URL}/gastos/{id_gasto}",

            headers={
                "Authorization": f"Bearer {token}"
            }

        )
