from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator


CantidadNoNegativa = Annotated[
    Decimal,
    Field(ge=0, max_digits=12, decimal_places=3),
]
CantidadPositiva = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=3),
]


class TipoMovimiento(str, Enum):
    ENTRADA = "Entrada"
    SALIDA = "Salida"
    AJUSTE = "Ajuste"


class InsumoBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=1000)
    categoria: str = Field(default="General", min_length=2, max_length=80)
    unidad_medida: str = Field(min_length=1, max_length=30)
    stock_minimo: CantidadNoNegativa = Decimal("0")
    activo: bool = True

    @field_validator("nombre", "categoria", "unidad_medida")
    @classmethod
    def limpiar_texto_obligatorio(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El valor no puede estar vacío.")
        return valor


class InsumoCreate(InsumoBase):
    stock_inicial: CantidadNoNegativa = Decimal("0")


class InsumoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=1000)
    categoria: str | None = Field(default=None, min_length=2, max_length=80)
    unidad_medida: str | None = Field(default=None, min_length=1, max_length=30)
    stock_minimo: CantidadNoNegativa | None = None
    activo: bool | None = None

    @field_validator("nombre", "categoria", "unidad_medida")
    @classmethod
    def limpiar_texto(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        valor = valor.strip()
        if not valor:
            raise ValueError("El valor no puede estar vacío.")
        return valor


class InsumoResumen(BaseModel):
    id_insumo: int
    nombre: str
    unidad_medida: str

    model_config = ConfigDict(from_attributes=True)


class InsumoResponse(InsumoBase):
    id_insumo: int
    stock_actual: Decimal
    stock_bajo: bool
    creado_en: datetime
    actualizado_en: datetime

    model_config = ConfigDict(from_attributes=True)


class MovimientoInventarioCreate(BaseModel):
    tipo: TipoMovimiento
    cantidad: CantidadNoNegativa
    motivo: str = Field(min_length=3, max_length=1000)
    referencia: str | None = Field(default=None, max_length=120)

    @field_validator("motivo")
    @classmethod
    def limpiar_motivo(cls, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise ValueError("El motivo no puede estar vacío.")
        return valor

    @field_validator("cantidad")
    @classmethod
    def validar_cantidad_segun_tipo(cls, valor: Decimal, info) -> Decimal:
        tipo = info.data.get("tipo")
        if tipo in (TipoMovimiento.ENTRADA, TipoMovimiento.SALIDA) and valor <= 0:
            raise ValueError("Las entradas y salidas requieren una cantidad mayor que cero.")
        return valor


class MovimientoInventarioResponse(BaseModel):
    id_movimiento: int
    tipo: str
    cantidad: Decimal
    stock_anterior: Decimal
    stock_posterior: Decimal
    motivo: str
    referencia: str | None
    creado_en: datetime
    id_insumo: int
    id_usuario: int | None
    id_compra: int | None

    model_config = ConfigDict(from_attributes=True)
