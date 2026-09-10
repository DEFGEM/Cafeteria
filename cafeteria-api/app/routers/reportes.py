from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.permissions import requiere_roles
from app.services.reporte_service import ReporteService
from fastapi.responses import StreamingResponse
from io import BytesIO
from typing import Optional
from app.schemas.producto import ProductoResponse
from app.schemas.reporte import ReportePedidoResponse

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)

@router.get("/")
def obtener_reporte(
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)
):

    return ReporteService.obtener(db)

@router.get("/pdf")
def reporte_pdf(
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)
):

    return ReporteService.generar_pdf(db)


@router.get("/excel")
def reporte_excel(
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)
):

    return ReporteService.generar_excel(db)

@router.get(
    "/productos",
    response_model=list[ProductoResponse]
)
def reporte_productos(

    nombre: Optional[str] = None,
    id_categoria: Optional[int] = None,
    activo: Optional[bool] = None,
    stock_minimo: Optional[int] = None,

    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)

):

    return ReporteService.reporte_productos(
        db,
        nombre,
        id_categoria,
        activo,
        stock_minimo
    )

@router.get("/productos/pdf/productos")
def pdf_productos(

    nombre: str | None = None,

    categoria: int | None = None,

    activo: bool | None = None,

    stock_minimo: int | None = None,

    usuario=Depends(requiere_roles("administrador")),

    db: Session = Depends(get_db)

):

    return ReporteService.generar_pdf_productos(

        db,

        nombre,

        categoria,

        activo,

        stock_minimo

    )

@router.get("/productos/excel")
def excel_productos(

    nombre: str | None = None,

    categoria: int | None = None,

    activo: bool | None = None,

    stock_minimo: int | None = None,

    usuario=Depends(requiere_roles("administrador")),

    db: Session = Depends(get_db)

):

    return ReporteService.generar_excel_productos(

        db,

        nombre,

        categoria,

        activo,

        stock_minimo

    )

@router.get("/productos/pdf")
def reporte_productos_pdf(

    nombre: Optional[str] = None,
    id_categoria: Optional[int] = None,
    activo: Optional[bool] = None,
    stock_minimo: Optional[int] = None,

    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)

):

    return ReporteService.generar_pdf_productos(

        db,

        nombre,

        id_categoria,

        activo,

        stock_minimo

    )

@router.get("/productos/excel/productos")
def reporte_productos_excel(

    nombre: Optional[str] = None,
    id_categoria: Optional[int] = None,
    activo: Optional[bool] = None,
    stock_minimo: Optional[int] = None,

    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db)

):

    return ReporteService.generar_excel_productos(

        db,

        nombre,

        id_categoria,

        activo,

        stock_minimo

    )

@router.get("/pedidos", response_model=list[ReportePedidoResponse])
def reporte_pedidos(

    estado: str | None = None,

    id_mesa: int | None = None,

    fecha_inicio: str | None = None,

    fecha_fin: str | None = None,

    usuario=Depends(requiere_roles("administrador")),

    db: Session = Depends(get_db)

):

    return ReporteService.listar_pedidos(

        db,

        estado,

        id_mesa,

        fecha_inicio,

        fecha_fin

    )

@router.get("/pedidos/pdf")
def pdf_pedidos(

    estado: str | None = None,

    id_mesa: int | None = None,

    fecha_inicio: str | None = None,

    fecha_fin: str | None = None,

    usuario=Depends(requiere_roles("administrador")),

    db: Session = Depends(get_db)

):

    return ReporteService.generar_pdf_pedidos(

        db,

        estado,

        id_mesa,

        fecha_inicio,

        fecha_fin

    )

@router.get("/pedidos/excel")
def excel_pedidos(

    estado: str | None = None,

    id_mesa: int | None = None,

    fecha_inicio: str | None = None,

    fecha_fin: str | None = None,

    usuario=Depends(requiere_roles("administrador")),

    db: Session = Depends(get_db)

):

    return ReporteService.generar_excel_pedidos(

        db,

        estado,

        id_mesa,

        fecha_inicio,

        fecha_fin

    )

@router.get("/inventario")
def reporte_inventario(

    categoria: Optional[int] = None,

    stock_bajo: Optional[bool] = None,

    usuario=Depends(requiere_roles("administrador")),

    db: Session = Depends(get_db)

):

    return ReporteService.reporte_inventario(

        db,

        categoria,

        stock_bajo

    )
