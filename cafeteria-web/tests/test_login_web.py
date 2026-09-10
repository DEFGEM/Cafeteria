import unittest
from unittest.mock import Mock, patch

from app import app


class LoginWebTest(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY="web-test-secret")
        self.client = app.test_client()

    def test_login_get_muestra_formulario(self):
        response = self.client.get("/login")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<form method="POST" action="/login">', response.data)

    def test_ruta_protegida_redirige_a_login_funcional(self):
        response = self.client.get("/dashboard", follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.request.path, "/login")
        self.assertIn(b'<form method="POST" action="/login">', response.data)

    @patch("app.ApiService.login")
    def test_login_post_conserva_autenticacion(self, api_login):
        api_login.return_value = Mock(
            status_code=200,
            json=lambda: {
                "access_token": "token-prueba",
                "usuario": "Administrador",
                "rol": "administrador",
            },
        )

        response = self.client.post(
            "/login",
            data={"username": "admin@cafeteria.local", "password": "Admin123!"},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers["Location"], "/dashboard")
        api_login.assert_called_once_with("admin@cafeteria.local", "Admin123!")


if __name__ == "__main__":
    unittest.main()
