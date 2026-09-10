from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    nombre_completo: str = Field(min_length=2, max_length=100)
    email: EmailStr
    id_rol: int = Field(gt=0)


class UsuarioCreate(UsuarioBase):
    password: str = Field(min_length=8, max_length=128)


class UsuarioUpdate(BaseModel):
    nombre_completo: str = Field(min_length=2, max_length=100)
    email: EmailStr
    id_rol: int = Field(gt=0)
    activo: bool
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UsuarioResponse(UsuarioBase):
    id_usuario: int
    activo: bool
    # Los usuarios demo heredados usan el dominio interno `.local`.
    email: str

    model_config = {
        "from_attributes": True
    }
