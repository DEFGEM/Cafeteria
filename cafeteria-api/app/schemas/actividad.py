from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class EventoAuditoriaResponse(BaseModel):
    id_evento: int
    modulo: str
    accion: str
    entidad: str | None
    id_entidad: str | None
    descripcion: str
    severidad: str
    datos: dict[str, Any] | list[Any] | None
    creado_en: datetime
    id_usuario: int | None

    model_config = ConfigDict(from_attributes=True)
