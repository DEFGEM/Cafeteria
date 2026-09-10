from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError, jwt
from sqlalchemy.orm import Session, joinedload

from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if not payload.get("sub") or not payload.get("id") or not payload.get("rol"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            id_usuario = int(payload["id"])
        except (TypeError, ValueError, KeyError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

        usuario = (
            db.query(Usuario)
            .options(joinedload(Usuario.rol))
            .filter(Usuario.id_usuario == id_usuario)
            .first()
        )
        if not usuario or not usuario.activo or not usuario.rol:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La sesión ya no está activa",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            **payload,
            "sub": usuario.email,
            "id": usuario.id_usuario,
            "rol": usuario.rol.nombre.lower().strip(),
        }

    except ExpiredSignatureError:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"},

        )

    except JWTError:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},

        )
