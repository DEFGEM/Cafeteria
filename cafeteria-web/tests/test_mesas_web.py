import unittest
from unittest.mock import Mock, patch

from app import app, media_url


MESAS = [
    {"id_mesa": 7, "numero": 1, "capacidad": 4, "estado": "Libre"},
    {"id_mesa": 9, "numero": 10, "capacidad": 2, "estado": "Ocupada"},
]


class MesasWebTest(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY="web-test-secret")
        self.client = app.test_client()

    def login_session(self, rol="administrador"):
        with self.client.session_transaction() as session:
            session["token"] = "token-prueba"
            session["usuario"] = "Usuario de prueba"
            session["rol"] = rol

    @patch("app.ApiService.obtener_mesas", return_value=MESAS)
    def test_administrador_ve_catalogo_y_formulario(self, obtener_mesas):
        self.login_session()
        response = self.client.get("/mesas")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Mesa 1", response.data)
        self.assertIn(b"Mesa 10", response.data)
        self.assertIn(b"Agregar mesa", response.data)
        obtener_mesas.assert_called_once_with("token-prueba")

    @patch("app.ApiService.crear_mesa")
    def test_administrador_puede_agregar_mesa(self, crear_mesa):
        self.login_session()
        crear_mesa.return_value = Mock(status_code=200)

        response = self.client.post(
            "/mesas",
            data={"numero": "4", "capacidad": "6", "estado": "Libre"},
        )

        self.assertEqual(response.status_code, 302)
        crear_mesa.assert_called_once_with(
            "token-prueba",
            {"numero": 4, "capacidad": 6, "estado": "Libre"},
        )

    @patch("app.ApiService.crear_mesa")
    def test_mesero_no_puede_agregar_mesa(self, crear_mesa):
        self.login_session("mesero")
        response = self.client.post(
            "/mesas",
            data={"numero": "4", "capacidad": "6", "estado": "Libre"},
        )

        self.assertEqual(response.status_code, 302)
        crear_mesa.assert_not_called()

    @patch("app.ApiService.obtener_pedidos", return_value=[])
    @patch("app.ApiService.obtener_mesas", return_value=MESAS)
    def test_pedidos_usa_id_real_y_muestra_numero_de_mesa(self, obtener_mesas, _):
        self.login_session("mesero")
        response = self.client.get("/pedidos")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'value="7"', response.data)
        self.assertIn("Mesa 1 · 4 personas".encode(), response.data)
        self.assertNotIn(b'value="9"', response.data)
        obtener_mesas.assert_called_once_with("token-prueba")

    @patch("app.ApiService.obtener_pedidos_cocina", return_value=[])
    def test_panel_cocina_deja_de_ser_pantalla_vacia(self, obtener_pedidos):
        self.login_session("cocina")
        response = self.client.get("/cocina")

        self.assertEqual(response.status_code, 200)
        self.assertIn("Pedidos de cocina".encode(), response.data)
        obtener_pedidos.assert_called_once_with("token-prueba")

    @patch("app.ApiService.obtener_pedidos_caja", return_value=[])
    def test_panel_caja_deja_de_ser_pantalla_vacia(self, obtener_pedidos):
        self.login_session("caja")
        response = self.client.get("/caja")

        self.assertEqual(response.status_code, 200)
        self.assertIn("Pedidos listos para cobrar".encode(), response.data)
        obtener_pedidos.assert_called_once_with("token-prueba")

    @patch("app.Config.API_URL", "https://api.example.com")
    def test_imagenes_relativas_se_resuelven_con_la_api_configurada(self):
        self.assertEqual(
            media_url("uploads/cafe.png"),
            "https://api.example.com/uploads/cafe.png",
        )
        self.assertEqual(
            media_url("https://cdn.example.com/cafe.png"),
            "https://cdn.example.com/cafe.png",
        )


if __name__ == "__main__":
    unittest.main()
