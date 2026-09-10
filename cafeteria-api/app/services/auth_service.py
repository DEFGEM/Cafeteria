from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.usuario import Usuario
from app.auth.security import verify_password
from app.auth.jwt import crear_token


class AuthService:

    @staticmethod
    def login(db: Session, email: str, password: str):

        usuario = (
            db.query(Usuario)
            .filter(Usuario.email == email)
            .first()
        )

        if not usuario or not usuario.activo:
            return None

        if not verify_password(
            password,
            usuario.password_hash
        ):
            return None

        token = crear_token(
            {
                "sub": usuario.email,
                "id": usuario.id_usuario,
                "rol": usuario.rol.nombre
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "usuario": usuario.nombre_completo,
            "rol": usuario.rol.nombre,
        }

    @staticmethod
    def obtener_usuario_actual(db: Session, usuario_id: int):
        usuario = (
            db.query(Usuario)
            .filter(Usuario.id_usuario == usuario_id)
            .first()
        )

        if not usuario or not usuario.activo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El usuario de la sesión ya no está disponible.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id_usuario": usuario.id_usuario,
            "nombre_completo": usuario.nombre_completo,
            "email": usuario.email,
            "rol": usuario.rol.nombre,
            "activo": usuario.activo,
        }

    @staticmethod
    def actualizar_usuario_actual(db: Session, usuario_id: int, datos):
        usuario = AuthService.obtener_usuario_actual(db, usuario_id)
        entidad = db.get(Usuario, usuario["id_usuario"])
        email_ocupado = (
            db.query(Usuario.id_usuario)
            .filter(
                Usuario.email == datos.email,
                Usuario.id_usuario != usuario_id,
            )
            .first()
        )
        if email_ocupado:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El correo ya está registrado por otro usuario.",
            )

        entidad.nombre_completo = datos.nombre_completo.strip()
        entidad.email = datos.email
        db.commit()
        return AuthService.obtener_usuario_actual(db, usuario_id)
