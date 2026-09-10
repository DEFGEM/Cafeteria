from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.categoria import CategoriaSimple

class ProductoBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=1500)
    precio: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    stock: int = Field(ge=0, le=1_000_000)
    imagen: str | None = None
    activo: bool = True
    id_categoria: int = Field(gt=0)


class ProductoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str = Field(max_length=1500)
    precio: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    stock: int = Field(ge=0, le=1_000_000)
    imagen: str | None = None
    activo: bool
    id_categoria: int = Field(gt=0)


class ProductoUpdate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str = Field(max_length=1500)
    precio: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    stock: int = Field(ge=0, le=1_000_000)
    imagen: str | None = None
    activo: bool
    id_categoria: int = Field(gt=0)


class ProductoResponse(ProductoBase):

    id_producto: int

    categoria: CategoriaSimple

    model_config = {
        "from_attributes": True
    }
