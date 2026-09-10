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


class Gasto(Base):
    __tablename__ = "gasto"
    __table_args__ = (
        CheckConstraint("monto > 0", name="ck_gasto_monto_positivo"),
    )

    id_gasto = Column(Integer, primary_key=True, index=True)
    categoria = Column(String(80), nullable=False, index=True)
    descripcion = Column(Text, nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    fecha = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    metodo_pago = Column(String(40), nullable=True)
    comprobante = Column(String(255), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    actualizado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    eliminado_en = Column(DateTime(timezone=True), nullable=True)
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    usuario = relationship("Usuario")
