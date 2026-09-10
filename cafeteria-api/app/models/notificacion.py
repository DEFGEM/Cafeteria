from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Notificacion(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(140), nullable=False)
    mensaje = Column(Text, nullable=False)
    tipo = Column(String(50), nullable=False, default="sistema", index=True)
    severidad = Column(String(20), nullable=False, default="info")
    creado_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expira_en = Column(DateTime(timezone=True), nullable=True)
    id_usuario_destino = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    rol_destino = Column(String(30), nullable=True, index=True)
    id_usuario_creador = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"),
        nullable=True,
    )

    usuario_destino = relationship("Usuario", foreign_keys=[id_usuario_destino])
    usuario_creador = relationship("Usuario", foreign_keys=[id_usuario_creador])
    lecturas = relationship(
        "NotificacionLectura",
        back_populates="notificacion",
        cascade="all, delete-orphan",
    )


class NotificacionLectura(Base):
    __tablename__ = "notificacion_lectura"
    __table_args__ = (
        UniqueConstraint(
            "id_notificacion",
            "id_usuario",
            name="uq_notificacion_lectura_usuario",
        ),
    )

    id_lectura = Column(Integer, primary_key=True, index=True)
    leida_en = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    id_notificacion = Column(
        Integer,
        ForeignKey("notificacion.id_notificacion", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    notificacion = relationship("Notificacion", back_populates="lecturas")
    usuario = relationship("Usuario")
