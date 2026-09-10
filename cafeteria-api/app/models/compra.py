from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Compra(Base):
    __tablename__ = "compra"
    __table_args__ = (
        CheckConstraint("total >= 0", name="ck_compra_total_no_negativo"),
        CheckConstraint(
            "estado IN ('Pendiente', 'Recibida', 'Cancelada')",
            name="ck_compra_estado_valido",
        ),
    )

    id_compra = Column(Integer, primary_key=True, index=True)
    proveedor = Column(String(120), nullable=False)
    folio = Column(String(80), nullable=True, unique=True)
    fecha = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    estado = Column(String(20), nullable=False, default="Pendiente", index=True)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    observaciones = Column(Text, nullable=True)
    recibido_en = Column(DateTime(timezone=True), nullable=True)
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    actualizado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"),
        nullable=False,
    )

    usuario = relationship("Usuario")
    detalles = relationship(
        "DetalleCompra",
        back_populates="compra",
        cascade="all, delete-orphan",
        order_by="DetalleCompra.id_detalle_compra",
    )
    movimientos_inventario = relationship(
        "MovimientoInventario",
        back_populates="compra",
    )
