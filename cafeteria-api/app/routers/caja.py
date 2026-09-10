from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.caja_service import CajaService
from app.services.detalle_pedido_service import DetallePedidoService
from app.schemas.pedido import PagoCreate, PedidoResponse
from app.schemas.detalle_pedido import DetallePedidoView
from app.auth.permissions import requiere_roles

router = APIRouter(
    prefix="/caja",
    tags=["Caja"]
)

@router.get("/pedidos", response_model=list[PedidoResponse])
def pedidos_listos(
    usuario=Depends(
        requiere_roles(
            "administrador",
            "caja"
        )
    ),
    db: Session = Depends(get_db)
):
    return CajaService.pedidos_listos(db)


@router.get("/historial", response_model=list[PedidoResponse])
def obtener_historial_caja(
    incluir_cancelados: bool = True,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "caja",
        )
    ),
    db: Session = Depends(get_db),
):
    return CajaService.historial(
        db,
        incluir_cancelados=incluir_cancelados,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/pedidos/{id_pedido}/detalle",
    response_model=list[DetallePedidoView]
)
def obtener_detalle_pedido_caja(
    id_pedido: int,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "caja"
        )
    ),
    db: Session = Depends(get_db)
):
    return DetallePedidoService.listar_por_pedido(
        db,
        id_pedido
    )


@router.post(
    "/pedidos/{id_pedido}/cobrar",
    response_model=PedidoResponse
)
@router.put(
    "/pedidos/{id_pedido}/cobrar",
    response_model=PedidoResponse,
    deprecated=True,
)
def cobrar_pedido(
    id_pedido: int,
    datos: PagoCreate,
    usuario=Depends(
        requiere_roles(
            "administrador",
            "caja"
        )
    ),
    db: Session = Depends(get_db)
):
    return CajaService.cobrar(
        db,
        id_pedido,
        datos,
        usuario["id"],
    )
