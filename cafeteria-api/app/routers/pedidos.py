from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.pedido import (
    PedidoCompletoCreate,
    PedidoCreate,
    PedidoEstado,
    PedidoResponse
)
from app.services.pedido_service import PedidoService

from app.schemas.pedido import PedidoEstadoUpdate

from app.auth.permissions import requiere_roles

from typing import Optional

router = APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"]
)


@router.post("/", response_model=PedidoResponse)
def crear_pedido(
    datos: PedidoCreate,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):
    return PedidoService.crear(
        db,
        datos,
        usuario["id"]
    )


@router.post("/completo", response_model=PedidoResponse, status_code=201)
def crear_pedido_completo(
    datos: PedidoCompletoCreate,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero",
        )
    ),
    db: Session = Depends(get_db),
):
    return PedidoService.crear_completo(
        db,
        datos,
        usuario["id"],
    )


@router.get("/{id_pedido}", response_model=PedidoResponse)
def obtener_pedido(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):

    pedido = PedidoService.obtener(db, id_pedido)

    if usuario["rol"] == "mesero" and pedido.id_usuario != usuario["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes consultar pedidos de otro mesero.",
        )

    return pedido

@router.get("/", response_model=list[PedidoResponse])
def listar_pedidos(
    estado: Optional[PedidoEstado] = None,
    id_mesa: Optional[int] = None,
    id_usuario: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):

    if usuario["rol"] == "mesero":
        id_usuario = usuario["id"]

    return PedidoService.listar(
        db,
        estado,
        id_mesa,
        id_usuario,
        skip,
        limit
    )

@router.put("/{id_pedido}/estado",
            response_model=PedidoResponse)
def cambiar_estado(
    id_pedido: int,
    datos: PedidoEstadoUpdate,
    usuario=Depends(
        requiere_roles("administrador")
    ),
    db: Session = Depends(get_db)
):

    return PedidoService.cambiar_estado(
        db,
        id_pedido,
        datos.estado,
        usuario_id=usuario["id"],
        puede_gestionar_todos=True,
    )


@router.put("/{id_pedido}/cancelar", response_model=PedidoResponse)
def cancelar_pedido(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero",
        )
    ),
    db: Session = Depends(get_db),
):
    return PedidoService.cambiar_estado(
        db,
        id_pedido,
        PedidoEstado.CANCELADO,
        usuario_id=usuario["id"],
        puede_gestionar_todos=usuario["rol"] == "administrador",
    )

@router.delete("/{id_pedido}")
def eliminar_pedido(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):
    PedidoService.eliminar(
        db,
        id_pedido,
        usuario_id=usuario["id"],
        puede_gestionar_todos=usuario["rol"] == "administrador",
    )

    return {
        "mensaje": "Pedido eliminado correctamente."
    }
