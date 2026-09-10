from datetime import datetime, timedelta

from jose import jwt

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)


def crear_token(datos: dict):

    datos_token = datos.copy()

    expiracion = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    datos_token.update(
        {
            "exp": expiracion
        }
    )

    return jwt.encode(
        datos_token,
        SECRET_KEY,
        algorithm=ALGORITHM
    )