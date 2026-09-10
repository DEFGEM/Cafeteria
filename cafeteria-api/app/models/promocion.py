from sqlalchemy import (
    Boolean,
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


class Promocion(Base):
    __tablename__ = "promocion"
    __table_args__ = (
        CheckConstraint("valor > 0", name="ck_promocion_valor_positivo"),
        CheckConstraint("fecha_fin > fecha_inicio", name="ck_promocion_vigencia_valida"),
        CheckConstraint(
            "tipo IN ('Porcentaje', 'Monto', 'Precio fijo')",
            name="ck_promocion_tipo_valido",
        ),
    )

    id_promocion = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo = Column(String(20), nullable=False)
    valor = Column(Numeric(12, 2), nullable=False)
    fecha_inicio = Column(DateTime(timezone=True), nullable=False)
    fecha_fin = Column(DateTime(timezone=True), nullable=False)
    activo = Column(Boolean, nullable=False, default=True, index=True)
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    actualizado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    id_producto = Column(
        Integer,
        ForeignKey("producto.id_producto", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"),
        nullable=False,
    )

    producto = relationship("Producto")
    usuario = relationship("Usuario")
