from decimal import Decimal

from pydantic import BaseModel, Field


class DetallePedidoCreate(BaseModel):
    id_pedido: int = Field(gt=0)
    id_producto: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=999)


class DetallePedidoResponse(BaseModel):
    id_detalle: int
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal
    id_producto: int
    id_pedido: int

    model_config = {"from_attributes": True}


class DetallePedidoView(DetallePedidoResponse):
    producto: str
