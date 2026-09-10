from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ReporteMesaResponse(BaseModel):
    id_mesa: int
    numero: int
    capacidad: int
    estado: str

    model_config = ConfigDict(from_attributes=True)


class ReporteUsuarioResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    email: str
    id_rol: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class ReportePedidoResponse(BaseModel):
    id_pedido: int
    fecha: datetime | None
    estado: str
    total: Decimal
    id_mesa: int
    id_usuario: int
    mesa: ReporteMesaResponse | None
    usuario: ReporteUsuarioResponse | None

    model_config = ConfigDict(from_attributes=True)
