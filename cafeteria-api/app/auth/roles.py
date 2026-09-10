from fastapi import Depends, HTTPException

from app.auth.dependencies import obtener_usuario_actual


def solo_administrador(
    usuario=Depends(obtener_usuario_actual)
):

    if usuario["rol"].lower() != "administrador":

        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para acceder."
        )

    return usuario