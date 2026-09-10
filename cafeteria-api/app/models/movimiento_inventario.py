from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MovimientoInventario(Base):
    __tablename__ = "movimiento_inventario"
    __table_args__ = (
        CheckConstraint("cantidad >= 0", name="ck_movimiento_cantidad_no_negativa"),
        CheckConstraint("stock_anterior >= 0", name="ck_movimiento_stock_anterior"),
        CheckConstraint("stock_posterior >= 0", name="ck_movimiento_stock_posterior"),
        CheckConstraint(
            "tipo IN ('Entrada', 'Salida', 'Ajuste')",
            name="ck_movimiento_tipo_valido",
        ),
    )

    id_movimiento = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False, index=True)
    cantidad = Column(Numeric(12, 3), nullable=False)
    stock_anterior = Column(Numeric(12, 3), nullable=False)
    stock_posterior = Column(Numeric(12, 3), nullable=False)
    motivo = Column(Text, nullable=False)
    referencia = Column(String(120), nullable=True)
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    id_insumo = Column(
        Integer,
        ForeignKey("insumo.id_insumo", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    id_compra = Column(
        Integer,
        ForeignKey("compra.id_compra", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    insumo = relationship("Insumo", back_populates="movimientos")
    usuario = relationship("Usuario")
    compra = relationship("Compra", back_populates="movimientos_inventario")
