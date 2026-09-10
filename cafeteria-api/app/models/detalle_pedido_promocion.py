from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DetallePedidoPromocion(Base):
    __tablename__ = "detalle_pedido_promocion"

    id_detalle = Column(
        Integer,
        ForeignKey("detalle_pedido.id_detalle", ondelete="CASCADE"),
        primary_key=True,
    )
    id_promocion = Column(
        Integer,
        ForeignKey("promocion.id_promocion", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    precio_original = Column(Numeric(10, 2), nullable=False)
    precio_aplicado = Column(Numeric(10, 2), nullable=False)
    descuento = Column(Numeric(10, 2), nullable=False)
    creado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    detalle = relationship("DetallePedido", back_populates="promocion_aplicada")
    promocion = relationship("Promocion")
