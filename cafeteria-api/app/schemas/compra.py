from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.insumo import InsumoResumen


CantidadCompra = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=3),
]
CostoCompra = Annotated[
    Decimal,
    Field(ge=0, max_digits=12, decimal_places=2),
]


class EstadoCompra(str, Enum):
    PENDIENTE = "Pendiente"
    RECIBIDA = "Recibida"
    CANCELADA = "Cancelada"


class DetalleCompraCreate(BaseModel):
    id_insumo: int = Field(gt=0)
    cantidad: CantidadCompra
    costo_unitario: CostoCompra


class DetalleCompraResponse(DetalleCompraCreate):
    id_detalle_compra: int
    subtotal: Decimal
    insumo: InsumoResumen

    model_config = ConfigDict(from_attributes=True)


class CompraCreate(BaseModel):
    proveedor: str = Field(min_length=2, max_length=120)
    folio: str | None = Field(default=None, max_length=80)
    fecha: datetime | None = None
    estado: EstadoCompra = EstadoCompra.PENDIENTE
    observaciones: str | None = Field(default=None, max_length=1500)
    detalles: list[DetalleCompraCreate] = Field(min_length=1, max_length=100)

    @field_validator("proveedor")
    @classmethod
    def limpiar_proveedor(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El proveedor no puede estar vacío.")
        return valor

    @model_validator(mode="after")
    def validar_insumos_unicos(self):
        ids = [detalle.id_insumo for detalle in self.detalles]
        if len(ids) != len(set(ids)):
            raise ValueError("Cada insumo debe aparecer una sola vez por compra.")
        return self


class CompraUpdate(BaseModel):
    proveedor: str | None = Field(default=None, min_length=2, max_length=120)
    folio: str | None = Field(default=None, max_length=80)
    fecha: datetime | None = None
    estado: EstadoCompra | None = None
    observaciones: str | None = Field(default=None, max_length=1500)
    detalles: list[DetalleCompraCreate] | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    @model_validator(mode="after")
    def validar_insumos_unicos(self):
        if self.detalles is None:
            return self
        ids = [detalle.id_insumo for detalle in self.detalles]
        if len(ids) != len(set(ids)):
            raise ValueError("Cada insumo debe aparecer una sola vez por compra.")
        return self


class CompraResponse(BaseModel):
    id_compra: int
    proveedor: str
    folio: str | None
    fecha: datetime
    estado: str
    total: Decimal
    observaciones: str | None
    recibido_en: datetime | None
    creado_en: datetime
    actualizado_en: datetime
    id_usuario: int
    detalles: list[DetalleCompraResponse]

    model_config = ConfigDict(from_attributes=True)
