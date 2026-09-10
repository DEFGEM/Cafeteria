from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PreferenciaNegocio(Base):
    __tablename__ = "preferencia_negocio"

    id_preferencia = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), nullable=False, unique=True, index=True)
    valor = Column(JSON, nullable=False)
    descripcion = Column(Text, nullable=True)
    actualizado_en = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    id_usuario_actualizacion = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"),
        nullable=True,
    )

    usuario_actualizacion = relationship("Usuario")
