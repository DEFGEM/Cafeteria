from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Categoria(Base):

    __tablename__ = "categoria"

    id_categoria = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(80),
        unique=True,
        nullable=False
    )

    descripcion = Column(Text)