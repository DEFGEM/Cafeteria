import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth.dependencies import obtener_usuario_actual
from app.database import get_db
from app.main import app


class CajaHistorialApiTest(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides.clear()
        app.dependency_overrides[get_db] = lambda: object()
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()

    def autenticar_como(self, rol: str):
        app.dependency_overrides[obtener_usuario_actual] = lambda: {
            "id": 1,
            "sub": f"{rol}@example.com",
            "rol": rol,
        }

    @patch("app.routers.caja.CajaService.historial", return_value=[])
    def test_caja_y_administrador_pueden_consultar_historial(self, historial):
        for rol in ("caja", "administrador"):
            with self.subTest(rol=rol):
                historial.reset_mock()
                self.autenticar_como(rol)

                response = self.client.get(
                    "/caja/historial",
                    params={
                        "incluir_cancelados": "false",
                        "skip": 5,
                        "limit": 20,
                    },
                )

                self.assertEqual(response.status_code, 200)
                historial.assert_called_once()
                self.assertEqual(
                    historial.call_args.kwargs,
                    {
                        "incluir_cancelados": False,
                        "skip": 5,
                        "limit": 20,
                    },
                )

    @patch("app.routers.caja.CajaService.historial", return_value=[])
    def test_mesero_no_puede_consultar_historial(self, historial):
        self.autenticar_como("mesero")

        response = self.client.get("/caja/historial")

        self.assertEqual(response.status_code, 403)
        historial.assert_not_called()

    @patch("app.routers.caja.CajaService.historial", return_value=[])
    def test_historial_requiere_autenticacion(self, historial):
        response = self.client.get("/caja/historial")

        self.assertEqual(response.status_code, 401)
        historial.assert_not_called()

    def test_historial_valida_paginacion(self):
        self.autenticar_como("caja")

        response = self.client.get("/caja/historial", params={"limit": 0})

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
