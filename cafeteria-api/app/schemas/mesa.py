from typing import Literal

from pydantic import BaseModel, Field


EstadoMesa = Literal["Libre", "Ocupada", "Reservada"]


class MesaBase(BaseModel):
    numero: int = Field(gt=0, le=10000)
    capacidad: int = Field(gt=0, le=100)
    estado: EstadoMesa = "Libre"


class MesaCreate(BaseModel):
    numero: int = Field(gt=0, le=10000)
    capacidad: int = Field(gt=0, le=100)
    estado: EstadoMesa = "Libre"


class MesaUpdate(BaseModel):
    numero: int = Field(gt=0, le=10000)
    capacidad: int = Field(gt=0, le=100)
    estado: EstadoMesa


class MesaResponse(MesaBase):

    id_mesa: int

    model_config = {
        "from_attributes": True
    }
