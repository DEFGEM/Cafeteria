from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator


ValorPromocion = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=2),
]


class TipoPromocion(str, Enum):
    PORCENTAJE = "Porcentaje"
    MONTO = "Monto"
    PRECIO_FIJO = "Precio fijo"


class PromocionBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=1500)
    tipo: TipoPromocion
    valor: ValorPromocion
    fecha_inicio: datetime
    fecha_fin: datetime
    activo: bool = True
    id_producto: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validar_reglas(self):
        if self.fecha_fin <= self.fecha_inicio:
            raise ValueError("La fecha de fin debe ser posterior a la fecha de inicio.")
        if self.tipo == TipoPromocion.PORCENTAJE and self.valor > 100:
            raise ValueError("El porcentaje no puede superar 100.")
        return self


class PromocionCreate(PromocionBase):
    pass


class PromocionUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    descripcion: str | None = Field(default=None, max_length=1500)
    tipo: TipoPromocion | None = None
    valor: ValorPromocion | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    activo: bool | None = None
    id_producto: int | None = Field(default=None, gt=0)


class ProductoPromocionResumen(BaseModel):
    id_producto: int
    nombre: str
    precio: Decimal

    model_config = ConfigDict(from_attributes=True)


class PromocionResponse(PromocionBase):
    id_promocion: int
    id_usuario: int
    creado_en: datetime
    actualizado_en: datetime
    producto: ProductoPromocionResumen | None

    model_config = ConfigDict(from_attributes=True)
