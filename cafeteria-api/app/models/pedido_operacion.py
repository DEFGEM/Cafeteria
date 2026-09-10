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


class PedidoOperacion(Base):
    """Datos operativos 1:1 que extienden un pedido sin alterar su tabla base."""

    __tablename__ = "pedido_operacion"

    __table_args__ = (
        CheckConstraint(
            "monto_recibido IS NULL OR monto_recibido >= 0",
            name="ck_pedido_operacion_monto_recibido_no_negativo",
        ),
        CheckConstraint(
            "cambio IS NULL OR cambio >= 0",
            name="ck_pedido_operacion_cambio_no_negativo",
        ),
        CheckConstraint(
            "metodo_pago IS NULL OR "
            "metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia')",
            name="ck_pedido_operacion_metodo_pago_valido",
        ),
    )

    id_pedido = Column(
        Integer,
        ForeignKey("pedido.id_pedido", ondelete="CASCADE"),
        primary_key=True,
    )
    observaciones = Column(Text)
    creado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    preparacion_iniciada_en = Column(DateTime(timezone=True))
    listo_en = Column(DateTime(timezone=True))
    demora_reportada_en = Column(DateTime(timezone=True))
    nota_cocina = Column(Text)
    pagado_en = Column(DateTime(timezone=True))
    metodo_pago = Column(String(30))
    monto_recibido = Column(Numeric(10, 2))
    cambio = Column(Numeric(10, 2))
    referencia_pago = Column(String(120))
    id_usuario_caja = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
    )

    pedido = relationship("Pedido", back_populates="operacion")
    usuario_caja = relationship("Usuario")
