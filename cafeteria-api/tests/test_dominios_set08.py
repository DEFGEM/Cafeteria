import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models  # Registra las entidades base y sus relaciones.
from app.database import Base
from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.evento_auditoria import EventoAuditoria
from app.models.gasto import Gasto
from app.models.insumo import Insumo
from app.models.movimiento_inventario import MovimientoInventario
from app.models.notificacion import Notificacion, NotificacionLectura
from app.models.preferencia_negocio import PreferenciaNegocio
from app.models.promocion import Promocion
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.schemas.compra import CompraCreate, DetalleCompraCreate, EstadoCompra
from app.schemas.gasto import GastoCreate
from app.schemas.insumo import InsumoCreate, MovimientoInventarioCreate, TipoMovimiento
from app.schemas.notificacion import NotificacionCreate
from app.schemas.preferencia_negocio import (
    PreferenciaNegocioBatchItem,
    PreferenciaNegocioUpdate,
)
from app.schemas.promocion import PromocionCreate, TipoPromocion
from app.services.compra_service import CompraService
from app.services.gasto_service import GastoService
from app.services.insumo_service import InsumoService
from app.services.notificacion_service import NotificacionService
from app.services.preferencia_negocio_service import PreferenciaNegocioService


class DominiosSet08Test(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        rol = Rol(nombre="administrador", descripcion="Administrador")
        self.db.add(rol)
        self.db.flush()
        usuario = Usuario(
            nombre_completo="Admin de pruebas",
            email="admin@example.test",
            password_hash="no-se-utiliza",
            activo=True,
            id_rol=rol.id_rol,
        )
        self.db.add(usuario)
        self.db.commit()
        self.id_usuario = usuario.id_usuario

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def crear_insumo(self, nombre="Leche", stock="5", minimo="2"):
        return InsumoService.crear(
            self.db,
            InsumoCreate(
                nombre=nombre,
                categoria="Lácteos",
                unidad_medida="litros",
                stock_inicial=Decimal(stock),
                stock_minimo=Decimal(minimo),
            ),
            self.id_usuario,
        )

    def test_salida_sin_stock_revierte_el_movimiento(self):
        insumo = self.crear_insumo()

        with self.assertRaises(HTTPException) as contexto:
            InsumoService.registrar_movimiento(
                self.db,
                insumo.id_insumo,
                MovimientoInventarioCreate(
                    tipo=TipoMovimiento.SALIDA,
                    cantidad=Decimal("8"),
                    motivo="Consumo de cocina",
                ),
                self.id_usuario,
            )

        self.assertEqual(contexto.exception.status_code, 409)
        self.db.expire_all()
        persistido = self.db.get(Insumo, insumo.id_insumo)
        self.assertEqual(persistido.stock_actual, Decimal("5.000"))
        movimientos = (
            self.db.query(MovimientoInventario)
            .filter(MovimientoInventario.id_insumo == insumo.id_insumo)
            .count()
        )
        self.assertEqual(movimientos, 1)  # Únicamente el stock inicial.

    def test_compra_recibida_incrementa_inventario_en_una_transaccion(self):
        leche = self.crear_insumo()
        cafe = self.crear_insumo("Café molido", "1", "3")
        datos = CompraCreate(
            proveedor="Proveedor local",
            estado=EstadoCompra.RECIBIDA,
            detalles=[
                DetalleCompraCreate(
                    id_insumo=leche.id_insumo,
                    cantidad=Decimal("10"),
                    costo_unitario=Decimal("32.50"),
                ),
                DetalleCompraCreate(
                    id_insumo=cafe.id_insumo,
                    cantidad=Decimal("4"),
                    costo_unitario=Decimal("80"),
                ),
            ],
        )

        compra = CompraService.crear(self.db, datos, self.id_usuario)

        self.assertEqual(compra.estado, "Recibida")
        self.assertEqual(compra.total, Decimal("645.00"))
        self.db.expire_all()
        self.assertEqual(self.db.get(Insumo, leche.id_insumo).stock_actual, Decimal("15.000"))
        self.assertEqual(self.db.get(Insumo, cafe.id_insumo).stock_actual, Decimal("5.000"))
        movimientos_compra = (
            self.db.query(MovimientoInventario)
            .filter(MovimientoInventario.id_compra == compra.id_compra)
            .count()
        )
        self.assertEqual(movimientos_compra, 2)

    def test_compra_rechaza_insumos_duplicados(self):
        insumo = self.crear_insumo()
        detalle = {
            "id_insumo": insumo.id_insumo,
            "cantidad": "1",
            "costo_unitario": "10",
        }
        with self.assertRaises(ValidationError):
            CompraCreate(
                proveedor="Proveedor local",
                detalles=[detalle, detalle],
            )

    def test_eliminar_gasto_es_borrado_logico_y_auditable(self):
        gasto = GastoService.crear(
            self.db,
            GastoCreate(
                categoria="Servicios",
                descripcion="Pago de electricidad",
                monto=Decimal("450.25"),
            ),
            self.id_usuario,
        )

        eliminado = GastoService.eliminar(self.db, gasto.id_gasto, self.id_usuario)

        self.assertFalse(eliminado.activo)
        self.assertIsNotNone(eliminado.eliminado_en)
        self.assertEqual(GastoService.listar(self.db), [])
        self.assertGreaterEqual(
            self.db.query(EventoAuditoria)
            .filter(EventoAuditoria.id_entidad == str(gasto.id_gasto))
            .count(),
            2,
        )

    def test_notificacion_global_mantiene_lectura_por_usuario(self):
        notificacion = NotificacionService.crear(
            self.db,
            NotificacionCreate(
                titulo="Aviso de operación",
                mensaje="Se realizará el corte de caja.",
            ),
            self.id_usuario,
        )
        visibles = NotificacionService.listar_para_usuario(
            self.db,
            id_usuario=self.id_usuario,
            rol="administrador",
        )
        self.assertEqual([item.id_notificacion for item in visibles], [notificacion.id_notificacion])
        self.assertFalse(visibles[0].leida)

        leida = NotificacionService.marcar_leida(
            self.db,
            notificacion.id_notificacion,
            id_usuario=self.id_usuario,
            rol="administrador",
        )
        self.assertTrue(leida.leida)
        self.assertEqual(
            NotificacionService.contar_no_leidas(
                self.db,
                id_usuario=self.id_usuario,
                rol="administrador",
            ),
            0,
        )

    def test_preferencia_se_actualiza_sin_duplicar_clave(self):
        PreferenciaNegocioService.guardar(
            self.db,
            "pedidos.impuesto_porcentaje",
            PreferenciaNegocioUpdate(valor=16, descripcion="IVA"),
            self.id_usuario,
        )
        actualizada = PreferenciaNegocioService.guardar(
            self.db,
            "PEDIDOS.IMPUESTO_PORCENTAJE",
            PreferenciaNegocioUpdate(valor=8, descripcion="Tasa fronteriza"),
            self.id_usuario,
        )

        self.assertEqual(actualizada.valor, 8)
        self.assertEqual(self.db.query(PreferenciaNegocio).count(), 1)

    def test_promocion_valida_vigencia_y_porcentaje(self):
        ahora = datetime.now(timezone.utc)
        with self.assertRaises(ValidationError):
            PromocionCreate(
                nombre="Descuento imposible",
                tipo=TipoPromocion.PORCENTAJE,
                valor=Decimal("120"),
                fecha_inicio=ahora,
                fecha_fin=ahora + timedelta(days=1),
            )


if __name__ == "__main__":
    unittest.main()
