from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import transaccion
from app.models.mesa import Mesa
from app.models.notificacion import Notificacion
from app.models.pedido import Pedido
from app.schemas.pedido import MetodoPago, PedidoEstado
from app.services.pedido_service import PedidoService
from app.services.actividad_service import ActividadService


class CajaService:

    @staticmethod
    def pedidos_listos(db: Session):
        return PedidoService.listar(
            db,
            estado=PedidoEstado.LISTO,
            orden_ascendente=True,
        )

    @staticmethod
    def historial(
        db: Session,
        incluir_cancelados: bool = True,
        skip: int = 0,
        limit: int = 100,
    ):
        estados = [PedidoEstado.PAGADO]
        if incluir_cancelados:
            estados.append(PedidoEstado.CANCELADO)

        return PedidoService.listar_por_estados(
            db,
            estados=estados,
            skip=skip,
            limit=limit,
        )

    @staticmethod
    def cobrar(db: Session, id_pedido: int, datos, usuario_id: int):
        metodo_pago = getattr(datos.metodo_pago, "value", datos.metodo_pago)

        with transaccion(db):
            pedido = (
                db.query(Pedido)
                .filter(Pedido.id_pedido == id_pedido)
                .with_for_update()
                .first()
            )

            if not pedido:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pedido no encontrado.",
                )

            if pedido.estado == PedidoEstado.PAGADO.value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El pedido ya fue cobrado.",
                )

            if pedido.estado != PedidoEstado.LISTO.value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Solo se puede cobrar un pedido en estado 'Listo'.",
                )

            total = Decimal(pedido.total).quantize(Decimal("0.01"))
            monto_recibido = (
                Decimal(datos.monto_recibido).quantize(Decimal("0.01"))
                if datos.monto_recibido is not None
                else total
            )

            if metodo_pago == MetodoPago.EFECTIVO.value:
                if monto_recibido < total:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="El monto recibido es menor que el total del pedido.",
                    )
                cambio = monto_recibido - total
            else:
                if monto_recibido != total:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            "Para tarjeta o transferencia, el monto debe coincidir "
                            "con el total del pedido."
                        ),
                    )
                cambio = Decimal("0.00")

            pedido.estado = PedidoEstado.PAGADO.value
            pedido.metodo_pago = metodo_pago
            pedido.monto_recibido = monto_recibido
            pedido.cambio = cambio
            pedido.referencia_pago = datos.referencia_pago
            pedido.pagado_en = datetime.now(timezone.utc)
            pedido.id_usuario_caja = usuario_id

            mesa = (
                db.query(Mesa)
                .filter(Mesa.id_mesa == pedido.id_mesa)
                .with_for_update()
                .first()
            )
            if mesa:
                mesa.estado = "Libre"

            ActividadService.registrar(
                db,
                modulo="Caja",
                accion="pedido.pagado",
                entidad="Pedido",
                id_entidad=pedido.id_pedido,
                descripcion=(
                    f"Se cobró el pedido {pedido.id_pedido} por ${total} "
                    f"con {metodo_pago}."
                ),
                id_usuario=usuario_id,
                datos={
                    "metodo_pago": metodo_pago,
                    "monto_recibido": str(monto_recibido),
                    "cambio": str(cambio),
                },
            )
            db.add(
                Notificacion(
                    titulo="Pago confirmado",
                    mensaje=(
                        f"El pedido #{pedido.id_pedido} fue cobrado por "
                        f"${total}."
                    ),
                    tipo="pago",
                    severidad="success",
                    id_usuario_destino=pedido.id_usuario,
                    id_usuario_creador=usuario_id,
                )
            )

        return PedidoService.obtener(db, id_pedido)
