from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship

from app.database import Base


class Producto(Base):

    __tablename__ = "producto"

    id_producto = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    descripcion = Column(Text)

    precio = Column(
        Numeric(10,2),
        nullable=False
    )

    stock = Column(
        Integer,
        default=0
    )

    imagen = Column(
        String(255)
    )

    activo = Column(
        Boolean,
        default=True
    )

    id_categoria = Column(
        Integer,
        ForeignKey("categoria.id_categoria"),
        nullable=False
    )

    categoria = relationship("Categoria")