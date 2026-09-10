from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import obtener_usuario_actual
from app.schemas.auth import AuthMeResponse, AuthMeUpdate, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    respuesta = AuthService.login(
        db,
        form_data.username,
        form_data.password
    )

    if respuesta is None:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    return respuesta


@router.get("/me", response_model=AuthMeResponse)
def obtener_perfil(
    usuario=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return AuthService.obtener_usuario_actual(db, usuario["id"])


@router.put("/me", response_model=AuthMeResponse)
def actualizar_perfil(
    datos: AuthMeUpdate,
    usuario=Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return AuthService.actualizar_usuario_actual(db, usuario["id"], datos)
