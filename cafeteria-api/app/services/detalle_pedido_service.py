from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.detalle_pedido import DetallePedido
from app.models.pedido import Pedido
from app.models.producto import Producto


class DetallePedidoService:

    @staticmethod
    def _validar_acceso(pedido, usuario_id, puede_gestionar_todos):
        if (
            usuario_id is not None
            and not puede_gestionar_todos
            and pedido.id_usuario != usuario_id
        ):
            raise HTTPException(
                status_code=403,
                detail="No puedes modificar o consultar pedidos de otro mesero."
            )

    @staticmethod
    def crear(
        db: Session,
        datos,
        usuario_id: int | None = None,
        puede_gestionar_todos: bool = False,
    ):

        pedido = (
            db.query(Pedido)
            .filter(Pedido.id_pedido == datos.id_pedido)
            .first()
        )

        if not pedido:
            raise HTTPException(
                status_code=404,
                detail="Pedido no encontrado."
            )

        DetallePedidoService._validar_acceso(
            pedido,
            usuario_id,
            puede_gestionar_todos,
        )

        if pedido.estado != "Pendiente":
            raise HTTPException(
                status_code=409,
                detail="Solo se puede modificar un pedido pendiente."
            )

        producto = (
            db.query(Producto)
            .filter(Producto.id_producto == datos.id_producto)
            .first()
        )

        if not producto:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado."
            )

        if datos.cantidad <= 0:
            raise HTTPException(
                status_code=400,
                detail="La cantidad debe ser mayor que cero."
            )

        if producto.stock < datos.cantidad:
            raise HTTPException(
                status_code=400,
                detail="Stock insuficiente."
            )

        precio = Decimal(producto.precio)

        subtotal = precio * datos.cantidad

        detalle = DetallePedido(
            id_pedido=datos.id_pedido,
            id_producto=datos.id_producto,
            cantidad=datos.cantidad,
            precio_unitario=precio,
            subtotal=subtotal
        )

        db.add(detalle)

        producto.stock -= datos.cantidad

        pedido.total += subtotal

        db.commit()

        db.refresh(detalle)

        return detalle

    @staticmethod
    def listar_por_pedido(
        db: Session,
        id_pedido: int,
        usuario_id: int | None = None,
        puede_gestionar_todos: bool = False,
    ):

        pedido = db.query(Pedido).filter(Pedido.id_pedido == id_pedido).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado.")
        DetallePedidoService._validar_acceso(
            pedido,
            usuario_id,
            puede_gestionar_todos,
        )

        detalles = (
            db.query(DetallePedido)
            .filter(
                DetallePedido.id_pedido == id_pedido
            )
            .all()
        )

        resultado = []

        for d in detalles:

            resultado.append({

                "id_detalle": d.id_detalle,

                "id_pedido": d.id_pedido,

                "id_producto": d.id_producto,

                "cantidad": d.cantidad,

                "precio_unitario": d.precio_unitario,

                "subtotal": d.subtotal,

                "producto": d.producto.nombre

            })

        return resultado

    @staticmethod
    def eliminar(
        db: Session,
        id_detalle: int,
        usuario_id: int | None = None,
        puede_gestionar_todos: bool = False,
    ):

        detalle = (
            db.query(DetallePedido)
            .filter(DetallePedido.id_detalle == id_detalle)
            .first()
        )

        if not detalle:
            raise HTTPException(
                status_code=404,
                detail="Detalle no encontrado."
            )

        pedido = (
            db.query(Pedido)
            .filter(Pedido.id_pedido == detalle.id_pedido)
            .first()
        )

        if not pedido:
            raise HTTPException(
                status_code=404,
                detail="Pedido no encontrado."
            )

        DetallePedidoService._validar_acceso(
            pedido,
            usuario_id,
            puede_gestionar_todos,
        )

        if pedido.estado != "Pendiente":
            raise HTTPException(
                status_code=409,
                detail="Solo se puede modificar un pedido pendiente."
            )

        pedido.total = max(
            Decimal("0.00"),
            pedido.total - detalle.subtotal
        )

        producto = (
            db.query(Producto)
            .filter(Producto.id_producto == detalle.id_producto)
            .first()
        )

        if producto:
            producto.stock += detalle.cantidad

        db.delete(detalle)

        db.commit()

        db.refresh(pedido)

        return pedido
