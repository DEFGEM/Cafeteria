from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, JsonValue, field_validator


class PreferenciaNegocioUpdate(BaseModel):
    valor: JsonValue
    descripcion: str | None = Field(default=None, max_length=1000)


class PreferenciaNegocioResponse(BaseModel):
    id_preferencia: int
    clave: str
    valor: JsonValue
    descripcion: str | None
    actualizado_en: datetime
    id_usuario_actualizacion: int | None

    model_config = ConfigDict(from_attributes=True)


class PreferenciaNegocioBatchItem(PreferenciaNegocioUpdate):
    clave: str = Field(min_length=2, max_length=100)

    @field_validator("clave")
    @classmethod
    def validar_clave(cls, valor: str) -> str:
        valor = valor.strip().lower()
        if not all(caracter.isalnum() or caracter in "._-" for caracter in valor):
            raise ValueError(
                "La clave solo puede contener letras, números, puntos, guiones y guiones bajos."
            )
        return valor


class PreferenciasNegocioBatchUpdate(BaseModel):
    preferencias: list[PreferenciaNegocioBatchItem] = Field(min_length=1, max_length=100)
