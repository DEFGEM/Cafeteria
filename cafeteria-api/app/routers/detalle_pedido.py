from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.detalle_pedido import (
    DetallePedidoCreate,
    DetallePedidoResponse
)
from app.services.detalle_pedido_service import (
    DetallePedidoService
)

from app.schemas.detalle_pedido import DetallePedidoView

from app.auth.permissions import requiere_roles

router = APIRouter(
    prefix="/detalle-pedido",
    tags=["Detalle Pedido"]
)


@router.post("/", response_model=DetallePedidoResponse)
def agregar_producto(
    datos: DetallePedidoCreate,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):
    return DetallePedidoService.crear(
        db,
        datos,
        usuario_id=usuario["id"],
        puede_gestionar_todos=usuario["rol"] == "administrador",
    )

@router.get(
    "/pedido/{id_pedido}",
    response_model=list[DetallePedidoView]
)
def obtener_detalle_pedido(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):
    return DetallePedidoService.listar_por_pedido(
        db,
        id_pedido,
        usuario_id=usuario["id"],
        puede_gestionar_todos=usuario["rol"] == "administrador",
    )

@router.delete("/{id_detalle}")
def eliminar_producto(
    id_detalle: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "mesero"
        )
    ),
    db: Session = Depends(get_db)
):

    pedido = DetallePedidoService.eliminar(
        db,
        id_detalle,
        usuario_id=usuario["id"],
        puede_gestionar_todos=usuario["rol"] == "administrador",
    )

    return {
        "mensaje": "Producto eliminado del pedido.",
        "total": pedido.total
    }
