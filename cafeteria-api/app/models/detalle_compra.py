from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleCompra(Base):
    __tablename__ = "detalle_compra"
    __table_args__ = (
        CheckConstraint("cantidad > 0", name="ck_detalle_compra_cantidad_positiva"),
        CheckConstraint(
            "costo_unitario >= 0",
            name="ck_detalle_compra_costo_no_negativo",
        ),
    )

    id_detalle_compra = Column(Integer, primary_key=True, index=True)
    cantidad = Column(Numeric(12, 3), nullable=False)
    costo_unitario = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    id_compra = Column(
        Integer,
        ForeignKey("compra.id_compra", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id_insumo = Column(
        Integer,
        ForeignKey("insumo.id_insumo", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    compra = relationship("Compra", back_populates="detalles")
    insumo = relationship("Insumo", back_populates="detalles_compra")
