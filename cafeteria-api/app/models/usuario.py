from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)

    nombre_completo = Column(String(100), nullable=False)

    email = Column(String(120), unique=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    activo = Column(Boolean, default=True)

    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)

    rol = relationship("Rol")