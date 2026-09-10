from sqlalchemy import Column, Integer, String

from app.database import Base


class Mesa(Base):

    __tablename__ = "mesa"

    id_mesa = Column(
        Integer,
        primary_key=True,
        index=True
    )

    numero = Column(
        Integer,
        unique=True,
        nullable=False
    )

    capacidad = Column(
        Integer,
        nullable=False
    )

    estado = Column(
        String(20),
        nullable=False,
        default="Libre"
    )