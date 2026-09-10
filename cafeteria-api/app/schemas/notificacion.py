from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SeveridadNotificacion(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class NotificacionCreate(BaseModel):
    titulo: str = Field(min_length=2, max_length=140)
    mensaje: str = Field(min_length=2, max_length=2000)
    tipo: str = Field(default="sistema", min_length=2, max_length=50)
    severidad: SeveridadNotificacion = SeveridadNotificacion.INFO
    expira_en: datetime | None = None
    id_usuario_destino: int | None = Field(default=None, gt=0)
    rol_destino: str | None = Field(default=None, max_length=30)

    @model_validator(mode="after")
    def validar_destino(self):
        if self.id_usuario_destino is not None and self.rol_destino is not None:
            raise ValueError(
                "Indica un usuario o un rol de destino, no ambos al mismo tiempo."
            )
        return self


class NotificacionResponse(BaseModel):
    id_notificacion: int
    titulo: str
    mensaje: str
    tipo: str
    severidad: str
    creado_en: datetime
    expira_en: datetime | None
    id_usuario_destino: int | None
    rol_destino: str | None
    id_usuario_creador: int | None
    leida: bool = False
    leida_en: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ConteoNotificacionesResponse(BaseModel):
    no_leidas: int
