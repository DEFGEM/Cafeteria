from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import transaccion
from app.models.detalle_pedido import DetallePedido
from app.models.detalle_pedido_promocion import DetallePedidoPromocion
from app.models.mesa import Mesa
from app.models.notificacion import Notificacion
from app.models.pedido import Pedido
from app.models.pedido_operacion import PedidoOperacion
from app.models.producto import Producto
from app.models.promocion import Promocion
from app.schemas.pedido import PedidoEstado
from app.services.actividad_service import ActividadService
from app.services.promocion_service import PromocionService


TRANSICIONES_PERMITIDAS = {
    PedidoEstado.PENDIENTE.value: {
        PedidoEstado.EN_PREPARACION.value,
        PedidoEstado.CANCELADO.value,
    },
    PedidoEstado.EN_PREPARACION.value: {
        PedidoEstado.LISTO.value,
        PedidoEstado.CANCELADO.value,
    },
    PedidoEstado.LISTO.value: set(),
    PedidoEstado.PAGADO.value: set(),
    PedidoEstado.CANCELADO.value: set(),
}


def _valor_enum(valor):
    return getattr(valor, "value", valor)


def _registrar_notificacion(
    db: Session,
    *,
    titulo: str,
    mensaje: str,
    tipo: str,
    id_usuario_creador: int | None,
    severidad: str = "info",
    rol_destino: str | None = None,
    id_usuario_destino: int | None = None,
):
    db.add(
        Notificacion(
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo,
            severidad=severidad,
            rol_destino=rol_destino,
            id_usuario_destino=id_usuario_destino,
            id_usuario_creador=id_usuario_creador,
        )
    )


class PedidoService:

    @staticmethod
    def _consulta_respuesta(db: Session):
        return db.query(Pedido).options(
            joinedload(Pedido.mesa),
            joinedload(Pedido.operacion),
            selectinload(Pedido.detalles).joinedload(DetallePedido.producto),
            selectinload(Pedido.detalles).joinedload(
                DetallePedido.promocion_aplicada
            ),
        )

    @staticmethod
    def _orden_creacion(consulta, orden_ascendente: bool):
        creado_en = func.coalesce(PedidoOperacion.creado_en, Pedido.fecha)
        orden = creado_en.asc() if orden_ascendente else creado_en.desc()
        return consulta.outerjoin(PedidoOperacion, Pedido.operacion).order_by(orden)

    @staticmethod
    def crear(db: Session, datos, usuario_id: int):
        with transaccion(db):
            mesa = (
                db.query(Mesa)
                .filter(Mesa.id_mesa == datos.id_mesa)
                .with_for_update()
                .first()
            )

            if not mesa:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La mesa no existe.",
                )

            if mesa.estado != "Libre":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="La mesa no está disponible.",
                )

            mesa.estado = "Ocupada"
            pedido = Pedido(
                id_mesa=datos.id_mesa,
                id_usuario=usuario_id,
                estado=PedidoEstado.PENDIENTE.value,
                total=Decimal("0.00"),
                observaciones=datos.observaciones,
            )
            db.add(pedido)

        db.refresh(pedido)
        return pedido

    @staticmethod
    def crear_completo(db: Session, datos, usuario_id: int):
        ids_productos = [item.id_producto for item in datos.productos]
        ids_promociones = {
            item.id_promocion
            for item in datos.productos
            if item.id_promocion is not None
        }

        with transaccion(db):
            mesa = (
                db.query(Mesa)
                .filter(Mesa.id_mesa == datos.id_mesa)
                .with_for_update()
                .first()
            )

            if not mesa:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La mesa no existe.",
                )

            if mesa.estado != "Libre":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="La mesa no está disponible.",
                )

            productos = (
                db.query(Producto)
                .filter(Producto.id_producto.in_(ids_productos))
                .order_by(Producto.id_producto)
                .with_for_update()
                .all()
            )
            productos_por_id = {
                producto.id_producto: producto for producto in productos
            }

            promociones_por_id = {}
            if ids_promociones:
                promociones = (
                    db.query(Promocion)
                    .filter(Promocion.id_promocion.in_(ids_promociones))
                    .order_by(Promocion.id_promocion)
                    .with_for_update()
                    .all()
                )
                promociones_por_id = {
                    promocion.id_promocion: promocion
                    for promocion in promociones
                }
                promociones_faltantes = sorted(
                    ids_promociones - set(promociones_por_id)
                )
                if promociones_faltantes:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=(
                            "Promociones no encontradas: "
                            f"{promociones_faltantes}."
                        ),
                    )

            faltantes = sorted(set(ids_productos) - set(productos_por_id))
            if faltantes:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Productos no encontrados: {faltantes}.",
                )

            for item in datos.productos:
                producto = productos_por_id[item.id_producto]
                if not producto.activo:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"El producto '{producto.nombre}' no está disponible.",
                    )
                stock_disponible = producto.stock or 0
                if stock_disponible < item.cantidad:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Stock insuficiente para '{producto.nombre}'. "
                            f"Disponible: {stock_disponible}."
                        ),
                    )
                if item.id_promocion is not None:
                    promocion = promociones_por_id[item.id_promocion]
                    ahora = datetime.now(timezone.utc)
                    inicio = promocion.fecha_inicio
                    fin = promocion.fecha_fin
                    if inicio.tzinfo is None:
                        ahora = ahora.replace(tzinfo=None)
                    if (
                        not promocion.activo
                        or inicio > ahora
                        or fin < ahora
                    ):
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=(
                                f"La promoción '{promocion.nombre}' "
                                "ya no está vigente."
                            ),
                        )
                    if promocion.id_producto not in (
                        None,
                        producto.id_producto,
                    ):
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=(
                                f"La promoción '{promocion.nombre}' no aplica "
                                f"a '{producto.nombre}'."
                            ),
                        )

            pedido = Pedido(
                id_mesa=mesa.id_mesa,
                id_usuario=usuario_id,
                estado=PedidoEstado.PENDIENTE.value,
                total=Decimal("0.00"),
                observaciones=datos.observaciones,
                mesa=mesa,
            )
            total = Decimal("0.00")

            for item in datos.productos:
                producto = productos_por_id[item.id_producto]
                precio_original = Decimal(producto.precio).quantize(
                    Decimal("0.01")
                )
                promocion = (
                    promociones_por_id.get(item.id_promocion)
                    if item.id_promocion is not None
                    else None
                )
                precio = (
                    PromocionService.calcular_precio(
                        promocion,
                        precio_original,
                    )
                    if promocion is not None
                    else precio_original
                )
                if precio > precio_original:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"La promoción '{promocion.nombre}' produce un "
                            "precio mayor al precio normal."
                        ),
                    )
                subtotal = precio * item.cantidad

                detalle = DetallePedido(
                    producto=producto,
                    cantidad=item.cantidad,
                    precio_unitario=precio,
                    subtotal=subtotal,
                )
                if promocion is not None:
                    detalle.promocion_aplicada = DetallePedidoPromocion(
                        promocion=promocion,
                        precio_original=precio_original,
                        precio_aplicado=precio,
                        descuento=(precio_original - precio).quantize(
                            Decimal("0.01")
                        ),
                    )
                pedido.detalles.append(detalle)
                producto.stock -= item.cantidad
                total += subtotal

            pedido.total = total.quantize(Decimal("0.01"))
            mesa.estado = "Ocupada"
            db.add(pedido)
            db.flush()
            ActividadService.registrar(
                db,
                modulo="Pedidos",
                accion="pedido.creado",
                entidad="Pedido",
                id_entidad=pedido.id_pedido,
                descripcion=(
                    f"Se creó el pedido {pedido.id_pedido} para la mesa "
                    f"{mesa.numero} por ${pedido.total}."
                ),
                id_usuario=usuario_id,
                datos={
                    "id_mesa": mesa.id_mesa,
                    "productos": len(datos.productos),
                },
            )
            _registrar_notificacion(
                db,
                titulo="Nuevo pedido en cocina",
                mensaje=(
                    f"Pedido #{pedido.id_pedido} de la mesa {mesa.numero} "
                    "está pendiente de preparación."
                ),
                tipo="pedido",
                severidad="info",
                rol_destino="cocina",
                id_usuario_creador=usuario_id,
            )

        return PedidoService.obtener(db, pedido.id_pedido)

    @staticmethod
    def cambiar_estado(
        db: Session,
        id_pedido: int,
        estado,
        usuario_id: int | None = None,
        puede_gestionar_todos: bool = False,
    ):
        nuevo_estado = _valor_enum(estado)

        if nuevo_estado == PedidoEstado.PAGADO.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Utiliza el endpoint de Caja para registrar el pago.",
            )

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

            if (
                nuevo_estado == PedidoEstado.CANCELADO.value
                and usuario_id is not None
                and not puede_gestionar_todos
                and pedido.id_usuario != usuario_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No puedes cancelar pedidos de otro mesero.",
                )

            permitidos = TRANSICIONES_PERMITIDAS.get(pedido.estado, set())
            if nuevo_estado not in permitidos:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"No se puede cambiar el pedido de '{pedido.estado}' "
                        f"a '{nuevo_estado}'."
                    ),
                )

            ahora = datetime.now(timezone.utc)
            pedido.estado = nuevo_estado

            if nuevo_estado == PedidoEstado.EN_PREPARACION.value:
                pedido.preparacion_iniciada_en = ahora
            elif nuevo_estado == PedidoEstado.LISTO.value:
                pedido.listo_en = ahora
            elif nuevo_estado == PedidoEstado.CANCELADO.value:
                detalles = (
                    db.query(DetallePedido)
                    .filter(DetallePedido.id_pedido == pedido.id_pedido)
                    .all()
                )
                for detalle in detalles:
                    producto = (
                        db.query(Producto)
                        .filter(Producto.id_producto == detalle.id_producto)
                        .with_for_update()
                        .first()
                    )
                    if producto:
                        producto.stock += detalle.cantidad

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
                modulo="Pedidos",
                accion="pedido.estado_actualizado",
                entidad="Pedido",
                id_entidad=pedido.id_pedido,
                descripcion=(
                    f"El pedido {pedido.id_pedido} cambió de estado a "
                    f"{nuevo_estado}."
                ),
                id_usuario=usuario_id,
                severidad=(
                    "warning"
                    if nuevo_estado == PedidoEstado.CANCELADO.value
                    else "info"
                ),
                datos={"estado": nuevo_estado},
            )
            if nuevo_estado == PedidoEstado.LISTO.value:
                _registrar_notificacion(
                    db,
                    titulo="Pedido listo para cobrar",
                    mensaje=(
                        f"Pedido #{pedido.id_pedido} está listo para el cobro."
                    ),
                    tipo="pedido",
                    severidad="success",
                    rol_destino="caja",
                    id_usuario_creador=usuario_id,
                )
                _registrar_notificacion(
                    db,
                    titulo="Pedido listo",
                    mensaje=(
                        f"El pedido #{pedido.id_pedido} ya está listo y pasó "
                        "a Caja."
                    ),
                    tipo="pedido",
                    severidad="success",
                    id_usuario_destino=pedido.id_usuario,
                    id_usuario_creador=usuario_id,
                )

        return PedidoService.obtener(db, id_pedido)

    @staticmethod
    def reportar_demora(
        db: Session,
        id_pedido: int,
        nota: str,
        *,
        usuario_id: int,
    ):
        nota_limpia = nota.strip()
        if len(nota_limpia) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="La nota de demora es obligatoria.",
            )

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
            if pedido.estado not in {
                PedidoEstado.PENDIENTE.value,
                PedidoEstado.EN_PREPARACION.value,
            }:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Solo se pueden reportar demoras en pedidos activos.",
                )

            pedido.nota_cocina = nota_limpia
            pedido.demora_reportada_en = datetime.now(timezone.utc)
            ActividadService.registrar(
                db,
                modulo="Cocina",
                accion="pedido.demora_reportada",
                entidad="Pedido",
                id_entidad=pedido.id_pedido,
                descripcion=f"Se reportó una demora: {nota_limpia}",
                id_usuario=usuario_id,
                severidad="warning",
            )
            _registrar_notificacion(
                db,
                titulo=f"Demora en pedido #{pedido.id_pedido}",
                mensaje=nota_limpia,
                tipo="pedido",
                severidad="warning",
                id_usuario_destino=pedido.id_usuario,
                id_usuario_creador=usuario_id,
            )

        return PedidoService.obtener(db, id_pedido)

    @staticmethod
    def obtener(db: Session, id_pedido: int):
        pedido = (
            PedidoService._consulta_respuesta(db)
            .filter(Pedido.id_pedido == id_pedido)
            .first()
        )

        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado.",
            )

        return pedido

    @staticmethod
    def eliminar(
        db: Session,
        id_pedido: int,
        usuario_id: int | None = None,
        puede_gestionar_todos: bool = False,
    ):
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

            if (
                usuario_id is not None
                and not puede_gestionar_todos
                and pedido.id_usuario != usuario_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No puedes eliminar pedidos de otro mesero.",
                )

            if pedido.estado != PedidoEstado.PENDIENTE.value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Solo se puede eliminar un pedido pendiente.",
                )

            mesa = (
                db.query(Mesa)
                .filter(Mesa.id_mesa == pedido.id_mesa)
                .with_for_update()
                .first()
            )
            if mesa:
                mesa.estado = "Libre"

            detalles = (
                db.query(DetallePedido)
                .filter(DetallePedido.id_pedido == id_pedido)
                .all()
            )
            for detalle in detalles:
                producto = (
                    db.query(Producto)
                    .filter(Producto.id_producto == detalle.id_producto)
                    .with_for_update()
                    .first()
                )
                if producto:
                    producto.stock += detalle.cantidad

            db.delete(pedido)

    @staticmethod
    def listar(
        db: Session,
        estado: str = None,
        id_mesa: int = None,
        id_usuario: int = None,
        skip: int = 0,
        limit: int = 100,
        orden_ascendente: bool = False,
    ):
        consulta = PedidoService._consulta_respuesta(db)

        if estado:
            consulta = consulta.filter(Pedido.estado == _valor_enum(estado))
        if id_mesa:
            consulta = consulta.filter(Pedido.id_mesa == id_mesa)
        if id_usuario:
            consulta = consulta.filter(Pedido.id_usuario == id_usuario)

        return (
            PedidoService._orden_creacion(consulta, orden_ascendente)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def listar_por_estados(
        db: Session,
        estados,
        skip: int = 0,
        limit: int = 100,
        orden_ascendente: bool = False,
    ):
        estados_normalizados = [
            _valor_enum(estado)
            for estado in estados
            if estado is not None
        ]
        if not estados_normalizados:
            return []

        consulta = PedidoService._consulta_respuesta(db).filter(
            Pedido.estado.in_(estados_normalizados)
        )

        return (
            PedidoService._orden_creacion(consulta, orden_ascendente)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def listar_cocina(db: Session):
        consulta = (
            PedidoService._consulta_respuesta(db)
            .filter(
                Pedido.estado.in_(
                    [
                        PedidoEstado.PENDIENTE.value,
                        PedidoEstado.EN_PREPARACION.value,
                    ]
                )
            )
        )
        return PedidoService._orden_creacion(consulta, True).all()
