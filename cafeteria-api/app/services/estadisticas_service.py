from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido
from app.models.producto import Producto


class EstadisticasService:

    @staticmethod
    def dashboard(db: Session):

        pedidos_pagados = (
            db.query(Pedido)
            .filter(Pedido.estado == "Pagado")
            .count()
        )

        ventas = (
            db.query(func.sum(Pedido.total))
            .filter(Pedido.estado == "Pagado")
            .scalar()
        ) or 0

        productos = (
            db.query(func.sum(DetallePedido.cantidad))
            .scalar()
        ) or 0

        ticket = 0

        if pedidos_pagados > 0:
            ticket = round(
                ventas / pedidos_pagados,
                2
            )

        # Productos más vendidos

        top_productos = (

            db.query(
                Producto.nombre,
                func.sum(
                    DetallePedido.cantidad
                ).label("cantidad")
            )

            .join(
                DetallePedido,
                Producto.id_producto ==
                DetallePedido.id_producto
            )

            .group_by(
                Producto.nombre
            )

            .order_by(
                func.sum(
                    DetallePedido.cantidad
                ).desc()
            )

            .limit(5)

            .all()

        )

        return {

            "ventas": float(ventas),

            "pedidos": pedidos_pagados,

            "productos": int(productos),

            "ticket_promedio": float(ticket),

            "top_productos":[

                {
                    "nombre":p.nombre,
                    "cantidad":int(p.cantidad)
                }

                for p in top_productos

            ]

        }