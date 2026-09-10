from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.pedido import PedidoDemoraCreate, PedidoResponse
from app.schemas.detalle_pedido import DetallePedidoView
from app.services.pedido_service import PedidoService
from app.services.detalle_pedido_service import DetallePedidoService

from app.auth.permissions import requiere_roles

router = APIRouter(
    prefix="/cocina",
    tags=["Cocina"]
)


@router.get(
    "/pedidos",
    response_model=list[PedidoResponse]
)
def listar_pedidos_cocina(
    usuario=Depends(
        requiere_roles(
            "administrador",
            "cocina"
        )
    ),
    db: Session = Depends(get_db)
):

    return PedidoService.listar_cocina(db)


@router.get(
    "/pedidos/{id_pedido}/detalle",
    response_model=list[DetallePedidoView]
)
def obtener_detalle_pedido_cocina(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "cocina"
        )
    ),
    db: Session = Depends(get_db)
):

    return DetallePedidoService.listar_por_pedido(
        db,
        id_pedido
    )


@router.put(
    "/pedidos/{id_pedido}/preparar",
    response_model=PedidoResponse
)
def preparar_pedido(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "cocina"
        )
    ),
    db: Session = Depends(get_db)
):

    return PedidoService.cambiar_estado(
        db,
        id_pedido,
        "En preparación",
        usuario_id=usuario["id"],
        puede_gestionar_todos=True,
    )


@router.put(
    "/pedidos/{id_pedido}/listo",
    response_model=PedidoResponse
)
def pedido_listo(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "cocina"
        )
    ),
    db: Session = Depends(get_db)
):

    return PedidoService.cambiar_estado(
        db,
        id_pedido,
        "Listo",
        usuario_id=usuario["id"],
        puede_gestionar_todos=True,
    )


@router.post(
    "/pedidos/{id_pedido}/demora",
    response_model=PedidoResponse,
)
def reportar_demora(
    id_pedido: int,
    datos: PedidoDemoraCreate,
    usuario=Depends(requiere_roles("administrador", "cocina")),
    db: Session = Depends(get_db),
):
    return PedidoService.reportar_demora(
        db,
        id_pedido,
        datos.nota,
        usuario_id=usuario["id"],
    )
