import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import app.models  # Registra las entidades y relaciones base.
from app.database import Base
from app.models.categoria import Categoria
from app.models.mesa import Mesa
from app.models.pedido import Pedido
from app.models.pedido_operacion import PedidoOperacion
from app.models.producto import Producto
from app.models.promocion import Promocion
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.schemas.pedido import PagoCreate, PedidoCompletoCreate, PedidoResponse
from app.schemas.auth import AuthMeUpdate
from app.schemas.usuario import UsuarioResponse
from app.services.auth_service import AuthService
from app.services.caja_service import CajaService
from app.services.mesa_service import MesaService
from app.services.pedido_service import PedidoService
from app.schemas.mesa import MesaCreate, MesaUpdate
from app.schema_runtime import ensure_runtime_schema, missing_runtime_tables


class BackendCoreTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)

        with Session(self.engine) as db:
            rol_mesero = Rol(nombre="mesero")
            rol_caja = Rol(nombre="caja")
            categoria = Categoria(nombre="Bebidas")
            db.add_all([rol_mesero, rol_caja, categoria])
            db.flush()

            mesero = Usuario(
                nombre_completo="Mesero de pruebas",
                email="mesero@example.com",
                password_hash="no-se-utiliza",
                activo=True,
                id_rol=rol_mesero.id_rol,
            )
            caja = Usuario(
                nombre_completo="Caja de pruebas",
                email="caja@example.com",
                password_hash="no-se-utiliza",
                activo=True,
                id_rol=rol_caja.id_rol,
            )
            mesa = Mesa(numero=1, capacidad=4, estado="Libre")
            producto = Producto(
                nombre="Café americano",
                precio=Decimal("35.00"),
                stock=5,
                activo=True,
                id_categoria=categoria.id_categoria,
            )
            db.add_all([mesero, caja, mesa, producto])
            db.flush()
            promocion = Promocion(
                nombre="Descuento de prueba",
                descripcion="20% en café",
                tipo="Porcentaje",
                valor=Decimal("20.00"),
                fecha_inicio=datetime.now(timezone.utc) - timedelta(days=1),
                fecha_fin=datetime.now(timezone.utc) + timedelta(days=1),
                activo=True,
                id_producto=producto.id_producto,
                id_usuario=mesero.id_usuario,
            )
            db.add(promocion)
            db.commit()

            self.id_mesero = mesero.id_usuario
            self.id_caja = caja.id_usuario
            self.id_mesa = mesa.id_mesa
            self.id_producto = producto.id_producto
            self.id_promocion = promocion.id_promocion

    def tearDown(self):
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def crear_pedido(self, cantidad=2):
        with Session(self.engine) as db:
            pedido = PedidoService.crear_completo(
                db,
                PedidoCompletoCreate(
                    id_mesa=self.id_mesa,
                    observaciones="Sin azúcar",
                    productos=[
                        {
                            "id_producto": self.id_producto,
                            "cantidad": cantidad,
                        }
                    ],
                ),
                self.id_mesero,
            )
            return pedido.id_pedido

    def test_respuesta_usuario_acepta_correo_interno_heredado(self):
        respuesta = UsuarioResponse.model_validate({
            "id_usuario": self.id_mesero,
            "nombre_completo": "Mesero de pruebas",
            "email": "mesero@cafeteria.local",
            "id_rol": 1,
            "activo": True,
        })

        self.assertEqual(respuesta.email, "mesero@cafeteria.local")

    def test_pedido_completo_es_atomico_y_calcula_total(self):
        id_pedido = self.crear_pedido()

        with Session(self.engine) as db:
            pedido = PedidoService.obtener(db, id_pedido)
            operacion = db.get(PedidoOperacion, id_pedido)
            self.assertEqual(pedido.total, Decimal("70.00"))
            self.assertEqual(pedido.observaciones, "Sin azúcar")
            self.assertEqual(operacion.observaciones, "Sin azúcar")
            self.assertEqual(len(pedido.detalles), 1)
            self.assertEqual(db.get(Producto, self.id_producto).stock, 3)
            self.assertEqual(db.get(Mesa, self.id_mesa).estado, "Ocupada")

            respuesta = PedidoResponse.model_validate(pedido)
            self.assertEqual(respuesta.observaciones, "Sin azúcar")
            self.assertIsNotNone(respuesta.creado_en)

            listado = PedidoService.listar(db)
            self.assertEqual([item.id_pedido for item in listado], [id_pedido])

    def test_pedido_aplica_y_conserva_promocion_vigente(self):
        with Session(self.engine) as db:
            pedido = PedidoService.crear_completo(
                db,
                PedidoCompletoCreate(
                    id_mesa=self.id_mesa,
                    productos=[
                        {
                            "id_producto": self.id_producto,
                            "cantidad": 2,
                            "id_promocion": self.id_promocion,
                        }
                    ],
                ),
                self.id_mesero,
            )
            self.assertEqual(pedido.total, Decimal("56.00"))
            self.assertEqual(pedido.detalles[0].precio_unitario, Decimal("28.00"))
            self.assertEqual(pedido.detalles[0].id_promocion, self.id_promocion)
            self.assertEqual(pedido.detalles[0].descuento, Decimal("7.00"))

            respuesta = PedidoResponse.model_validate(pedido)
            self.assertEqual(respuesta.detalles[0].id_promocion, self.id_promocion)

    def test_campos_operativos_no_forman_parte_de_la_tabla_pedido(self):
        campos_operativos = {
            "observaciones",
            "creado_en",
            "preparacion_iniciada_en",
            "listo_en",
            "pagado_en",
            "metodo_pago",
            "monto_recibido",
            "cambio",
            "referencia_pago",
            "id_usuario_caja",
        }

        self.assertTrue(campos_operativos.isdisjoint(Pedido.__table__.columns.keys()))
        self.assertTrue(
            campos_operativos.issubset(PedidoOperacion.__table__.columns.keys())
        )

    def test_stock_insuficiente_no_ocupa_mesa_ni_crea_pedido(self):
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as contexto:
                PedidoService.crear_completo(
                    db,
                    PedidoCompletoCreate(
                        id_mesa=self.id_mesa,
                        productos=[
                            {
                                "id_producto": self.id_producto,
                                "cantidad": 6,
                            }
                        ],
                    ),
                    self.id_mesero,
                )
            self.assertEqual(contexto.exception.status_code, 409)

        with Session(self.engine) as db:
            self.assertEqual(db.query(Pedido).count(), 0)
            self.assertEqual(db.get(Producto, self.id_producto).stock, 5)
            self.assertEqual(db.get(Mesa, self.id_mesa).estado, "Libre")

    def test_mesas_se_ordenan_y_no_permiten_numeros_repetidos(self):
        with Session(self.engine) as db:
            MesaService.crear(db, MesaCreate(numero=10, capacidad=2))
            MesaService.crear(db, MesaCreate(numero=2, capacidad=6))
            self.assertEqual(
                [mesa.numero for mesa in MesaService.listar(db)],
                [1, 2, 10],
            )
            with self.assertRaises(HTTPException) as contexto:
                MesaService.crear(db, MesaCreate(numero=2, capacidad=4))
            self.assertEqual(contexto.exception.status_code, 400)

    def test_mesa_con_pedido_activo_no_puede_liberarse(self):
        self.crear_pedido(cantidad=1)

        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as contexto:
                MesaService.actualizar(
                    db,
                    self.id_mesa,
                    MesaUpdate(numero=1, capacidad=4, estado="Libre"),
                )
            self.assertEqual(contexto.exception.status_code, 409)
            self.assertEqual(db.get(Mesa, self.id_mesa).estado, "Ocupada")

    def test_esquema_operativo_se_puede_preparar_idempotentemente(self):
        ensure_runtime_schema(self.engine)
        ensure_runtime_schema(self.engine)
        self.assertEqual(missing_runtime_tables(self.engine), [])

    def test_transiciones_y_doble_cobro(self):
        id_pedido = self.crear_pedido()

        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as contexto:
                PedidoService.cambiar_estado(db, id_pedido, "Listo")
            self.assertEqual(contexto.exception.status_code, 409)

        with Session(self.engine) as db:
            PedidoService.cambiar_estado(db, id_pedido, "En preparación")
        with Session(self.engine) as db:
            listo = PedidoService.cambiar_estado(db, id_pedido, "Listo")
            self.assertIsNotNone(listo.preparacion_iniciada_en)
            self.assertIsNotNone(listo.listo_en)

        datos_pago = PagoCreate(
            metodo_pago="Efectivo",
            monto_recibido=Decimal("100.00"),
        )
        with Session(self.engine) as db:
            pagado = CajaService.cobrar(
                db,
                id_pedido,
                datos_pago,
                self.id_caja,
            )
            self.assertEqual(pagado.estado, "Pagado")
            self.assertEqual(pagado.cambio, Decimal("30.00"))
            self.assertEqual(pagado.id_usuario_caja, self.id_caja)
            self.assertIsNotNone(pagado.pagado_en)
            self.assertEqual(pagado.mesa.estado, "Libre")

            operacion = db.get(PedidoOperacion, id_pedido)
            self.assertEqual(operacion.cambio, Decimal("30.00"))
            self.assertEqual(operacion.id_usuario_caja, self.id_caja)

        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as contexto:
                CajaService.cobrar(
                    db,
                    id_pedido,
                    datos_pago,
                    self.id_caja,
                )
            self.assertEqual(contexto.exception.status_code, 409)

    def test_cancelar_restaura_stock_y_libera_mesa(self):
        id_pedido = self.crear_pedido()

        with Session(self.engine) as db:
            cancelado = PedidoService.cambiar_estado(
                db,
                id_pedido,
                "Cancelado",
                usuario_id=self.id_mesero,
            )
            self.assertEqual(cancelado.estado, "Cancelado")

        with Session(self.engine) as db:
            self.assertEqual(db.get(Producto, self.id_producto).stock, 5)
            self.assertEqual(db.get(Mesa, self.id_mesa).estado, "Libre")

    def test_demora_de_cocina_se_conserva_en_el_pedido(self):
        id_pedido = self.crear_pedido()

        with Session(self.engine) as db:
            actualizado = PedidoService.reportar_demora(
                db,
                id_pedido,
                "Falta calentar la leche",
                usuario_id=self.id_mesero,
            )
            self.assertEqual(actualizado.nota_cocina, "Falta calentar la leche")
            self.assertIsNotNone(actualizado.demora_reportada_en)

            respuesta = PedidoResponse.model_validate(actualizado)
            self.assertEqual(respuesta.nota_cocina, "Falta calentar la leche")

    def test_usuario_puede_actualizar_su_propio_perfil(self):
        with Session(self.engine) as db:
            actualizado = AuthService.actualizar_usuario_actual(
                db,
                self.id_mesero,
                AuthMeUpdate(
                    nombre_completo="Mesero actualizado",
                    email="mesero.actualizado@example.com",
                ),
            )
            self.assertEqual(actualizado["nombre_completo"], "Mesero actualizado")
            self.assertEqual(actualizado["email"], "mesero.actualizado@example.com")

    def test_historial_caja_filtra_estados_terminales(self):
        id_pagado = self.crear_pedido()
        with Session(self.engine) as db:
            PedidoService.cambiar_estado(db, id_pagado, "En preparación")
        with Session(self.engine) as db:
            PedidoService.cambiar_estado(db, id_pagado, "Listo")
        with Session(self.engine) as db:
            CajaService.cobrar(
                db,
                id_pagado,
                PagoCreate(
                    metodo_pago="Efectivo",
                    monto_recibido=Decimal("100.00"),
                ),
                self.id_caja,
            )

        id_cancelado = self.crear_pedido(cantidad=1)
        with Session(self.engine) as db:
            PedidoService.cambiar_estado(
                db,
                id_cancelado,
                "Cancelado",
                usuario_id=self.id_mesero,
            )

        id_pendiente = self.crear_pedido(cantidad=1)

        with Session(self.engine) as db:
            historial = CajaService.historial(db)
            self.assertEqual(
                {pedido.id_pedido for pedido in historial},
                {id_pagado, id_cancelado},
            )
            self.assertNotIn(id_pendiente, {pedido.id_pedido for pedido in historial})

            solo_pagados = CajaService.historial(
                db,
                incluir_cancelados=False,
            )
            self.assertEqual(
                [pedido.id_pedido for pedido in solo_pagados],
                [id_pagado],
            )

            pagina = CajaService.historial(db, skip=0, limit=1)
            self.assertEqual(len(pagina), 1)
            self.assertIn(pagina[0].estado, {"Pagado", "Cancelado"})


if __name__ == "__main__":
    unittest.main()
