from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    usuario: str
    rol: str


class AuthMeResponse(BaseModel):
    id_usuario: int
    nombre_completo: str
    # Los datos demo heredados usan el dominio interno `.local`.
    email: str
    rol: str
    activo: bool


class AuthMeUpdate(BaseModel):
    nombre_completo: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=120)

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        email = value.strip().lower()
        if " " in email or email.count("@") != 1:
            raise ValueError("Escribe un correo válido.")
        local, dominio = email.split("@", 1)
        if not local or not dominio:
            raise ValueError("Escribe un correo válido.")
        return email
