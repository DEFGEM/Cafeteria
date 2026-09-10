from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Insumo(Base):
    __tablename__ = "insumo"
    __table_args__ = (
        CheckConstraint("stock_actual >= 0", name="ck_insumo_stock_no_negativo"),
        CheckConstraint("stock_minimo >= 0", name="ck_insumo_minimo_no_negativo"),
    )

    id_insumo = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    categoria = Column(String(80), nullable=False, default="General")
    unidad_medida = Column(String(30), nullable=False)
    stock_actual = Column(Numeric(12, 3), nullable=False, default=0)
    stock_minimo = Column(Numeric(12, 3), nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    actualizado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    movimientos = relationship(
        "MovimientoInventario",
        back_populates="insumo",
        cascade="all, delete-orphan",
    )
    detalles_compra = relationship("DetalleCompra", back_populates="insumo")

    @property
    def stock_bajo(self) -> bool:
        return self.stock_actual <= self.stock_minimo
