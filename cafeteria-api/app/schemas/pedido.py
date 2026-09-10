from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class PedidoEstado(str, Enum):
    PENDIENTE = "Pendiente"
    EN_PREPARACION = "En preparación"
    LISTO = "Listo"
    PAGADO = "Pagado"
    CANCELADO = "Cancelado"


class MetodoPago(str, Enum):
    EFECTIVO = "Efectivo"
    TARJETA = "Tarjeta"
    TRANSFERENCIA = "Transferencia"


class PedidoCreate(BaseModel):
    id_mesa: int = Field(gt=0)
    observaciones: str | None = Field(default=None, max_length=500)


class PedidoProductoCreate(BaseModel):
    id_producto: int = Field(gt=0)
    cantidad: int = Field(gt=0, le=999)
    id_promocion: int | None = Field(default=None, gt=0)


class PedidoCompletoCreate(PedidoCreate):
    productos: list[PedidoProductoCreate] = Field(min_length=1, max_length=100)

    @field_validator("productos")
    @classmethod
    def productos_no_repetidos(
        cls,
        productos: list[PedidoProductoCreate],
    ) -> list[PedidoProductoCreate]:
        ids = [producto.id_producto for producto in productos]
        if len(ids) != len(set(ids)):
            raise ValueError("Cada producto debe aparecer una sola vez.")
        return productos


class ProductoEnPedidoResponse(BaseModel):
    id_producto: int
    nombre: str

    model_config = {"from_attributes": True}


class DetalleEnPedidoResponse(BaseModel):
    id_detalle: int
    id_producto: int
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal
    id_promocion: int | None = None
    descuento: Decimal | None = None
    producto: ProductoEnPedidoResponse

    model_config = {"from_attributes": True}


class MesaEnPedidoResponse(BaseModel):
    id_mesa: int
    numero: int
    capacidad: int
    estado: str

    model_config = {"from_attributes": True}


class PedidoResponse(BaseModel):
    id_pedido: int
    estado: PedidoEstado
    total: Decimal
    id_mesa: int
    id_usuario: int
    observaciones: str | None = None
    fecha: datetime | None = None
    creado_en: datetime | None = None
    preparacion_iniciada_en: datetime | None = None
    listo_en: datetime | None = None
    demora_reportada_en: datetime | None = None
    nota_cocina: str | None = None
    pagado_en: datetime | None = None
    metodo_pago: MetodoPago | None = None
    monto_recibido: Decimal | None = None
    cambio: Decimal | None = None
    referencia_pago: str | None = None
    id_usuario_caja: int | None = None
    mesa: MesaEnPedidoResponse | None = None
    detalles: list[DetalleEnPedidoResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PedidoEstadoUpdate(BaseModel):
    estado: PedidoEstado


class PedidoDemoraCreate(BaseModel):
    nota: str = Field(min_length=2, max_length=500)


class PagoCreate(BaseModel):
    metodo_pago: MetodoPago
    monto_recibido: Decimal | None = Field(
        default=None,
        ge=Decimal("0.00"),
        max_digits=10,
        decimal_places=2,
    )
    referencia_pago: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def efectivo_requiere_monto(self):
        if self.metodo_pago == MetodoPago.EFECTIVO and self.monto_recibido is None:
            raise ValueError("El monto recibido es obligatorio para pagos en efectivo.")
        return self
