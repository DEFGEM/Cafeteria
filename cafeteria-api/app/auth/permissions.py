from fastapi import Depends
from fastapi import HTTPException

from app.auth.dependencies import obtener_usuario_actual


def requiere_roles(*roles):

    def verificar(
        usuario=Depends(obtener_usuario_actual)
    ):

        if usuario["rol"] not in roles:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para acceder a este recurso."
            )

        return usuario

    return verificar