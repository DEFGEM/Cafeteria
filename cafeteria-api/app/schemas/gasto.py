from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator


MontoPositivo = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=2),
]


class GastoBase(BaseModel):
    categoria: str = Field(min_length=2, max_length=80)
    descripcion: str = Field(min_length=3, max_length=1500)
    monto: MontoPositivo
    fecha: datetime | None = None
    metodo_pago: str | None = Field(default=None, max_length=40)
    comprobante: str | None = Field(default=None, max_length=255)

    @field_validator("categoria", "descripcion")
    @classmethod
    def limpiar_texto(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El valor no puede estar vacío.")
        return valor


class GastoCreate(GastoBase):
    pass


class GastoUpdate(BaseModel):
    categoria: str | None = Field(default=None, min_length=2, max_length=80)
    descripcion: str | None = Field(default=None, min_length=3, max_length=1500)
    monto: MontoPositivo | None = None
    fecha: datetime | None = None
    metodo_pago: str | None = Field(default=None, max_length=40)
    comprobante: str | None = Field(default=None, max_length=255)


class GastoResponse(BaseModel):
    id_gasto: int
    categoria: str
    descripcion: str
    monto: Decimal
    fecha: datetime
    metodo_pago: str | None
    comprobante: str | None
    activo: bool
    creado_en: datetime
    actualizado_en: datetime
    id_usuario: int

    model_config = ConfigDict(from_attributes=True)
