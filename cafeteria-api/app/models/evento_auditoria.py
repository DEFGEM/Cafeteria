from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EventoAuditoria(Base):
    __tablename__ = "evento_auditoria"

    id_evento = Column(Integer, primary_key=True, index=True)
    modulo = Column(String(50), nullable=False, index=True)
    accion = Column(String(60), nullable=False, index=True)
    entidad = Column(String(60), nullable=True, index=True)
    id_entidad = Column(String(60), nullable=True, index=True)
    descripcion = Column(Text, nullable=False)
    severidad = Column(String(20), nullable=False, default="info")
    datos = Column("metadata", JSON, nullable=True)
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    usuario = relationship("Usuario")
