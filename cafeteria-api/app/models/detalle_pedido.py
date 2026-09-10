from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class DetallePedido(Base):

    __tablename__ = "detalle_pedido"

    id_detalle = Column(
        Integer,
        primary_key=True,
        index=True
    )

    cantidad = Column(
        Integer,
        nullable=False
    )

    precio_unitario = Column(
        Numeric(10, 2),
        nullable=False
    )

    subtotal = Column(
        Numeric(10, 2),
        nullable=False
    )

    id_pedido = Column(
        Integer,
        ForeignKey("pedido.id_pedido"),
        nullable=False
    )

    id_producto = Column(
        Integer,
        ForeignKey("producto.id_producto"),
        nullable=False
    )

    pedido = relationship(
    "Pedido",
    back_populates="detalles"
    )

    producto = relationship("Producto")

    promocion_aplicada = relationship(
        "DetallePedidoPromocion",
        back_populates="detalle",
        cascade="all, delete-orphan",
        uselist=False,
    )

    @property
    def id_promocion(self):
        return (
            self.promocion_aplicada.id_promocion
            if self.promocion_aplicada is not None
            else None
        )

    @property
    def descuento(self):
        return (
            self.promocion_aplicada.descuento
            if self.promocion_aplicada is not None
            else None
        )
