from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import CORS_ORIGINS
from app.database import get_db
from app.schema_runtime import (
    ensure_runtime_schema,
    missing_runtime_tables,
    REQUIRED_RUNTIME_TABLES,
    runtime_schema_drift,
)
from app.auth.permissions import requiere_roles
from app.routers import usuarios

import app.models
from app.routers import roles
from app.routers import auth
from app.routers import categorias
from app.routers import productos
from app.routers import mesas
from app.routers import pedidos
from app.routers import detalle_pedido
from app.routers import cocina
from app.routers import caja
from app.routers import estadisticas
from app.routers import dashboard
from app.routers import reportes
from app.routers import insumos
from app.routers import compras
from app.routers import gastos
from app.routers import promociones
from app.routers import notificaciones
from app.routers import actividad
from app.routers import preferencias_negocio

from pathlib import Path

from fastapi.responses import FileResponse

@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_runtime_schema()
    yield


app = FastAPI(
    title="CoffeeAdmin API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = Path("uploads").resolve()
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


@app.get("/uploads/{filename}", include_in_schema=False)
def obtener_imagen_producto(filename: str):
    ruta = (UPLOADS_DIR / filename).resolve()
    if (
        ruta.parent != UPLOADS_DIR
        or ruta.suffix.lower() not in IMAGE_EXTENSIONS
        or not ruta.is_file()
    ):
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    return FileResponse(ruta)

app.include_router(roles.router)
app.include_router(usuarios.router)
app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(mesas.router)
app.include_router(pedidos.router)
app.include_router(detalle_pedido.router)
app.include_router(cocina.router)
app.include_router(caja.router)
app.include_router(estadisticas.router)
app.include_router(dashboard.router)
app.include_router(reportes.router)
app.include_router(insumos.router)
app.include_router(compras.router)
app.include_router(gastos.router)
app.include_router(promociones.router)
app.include_router(notificaciones.router)
app.include_router(actividad.router)
app.include_router(preferencias_negocio.router)

@app.get("/")
def inicio():
    return {
        "mensaje": "API Cafetería funcionando"
    }


@app.get("/health", tags=["Sistema"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La base de datos no está disponible.",
        ) from exc

    faltantes = missing_runtime_tables(db.get_bind())
    drift = runtime_schema_drift(db.get_bind())
    if faltantes or drift:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "mensaje": "El esquema operativo está incompleto.",
                "tablas_faltantes": faltantes,
                "columnas_faltantes": drift,
            },
        )

    return {
        "status": "ok",
        "database": "ok",
        "schema": "ok",
    }


@app.get("/sistema/schema", tags=["Sistema"])
def schema_status(
    usuario=Depends(requiere_roles("administrador")),
    db: Session = Depends(get_db),
):
    bind = db.get_bind()
    conteos = {}
    columnas_actuales = {}
    muestras = {}
    inspector = inspect(bind)
    drift = runtime_schema_drift(bind)
    diagnostic_tables = REQUIRED_RUNTIME_TABLES | {"ingrediente"}
    for table_name in sorted(set(inspect(bind).get_table_names()) & diagnostic_tables):
        conteos[table_name] = db.execute(
            text(f'SELECT COUNT(*) FROM "{table_name}"')
        ).scalar_one()
        if table_name in drift or table_name == "ingrediente":
            columnas_actuales[table_name] = [
                column["name"] for column in inspector.get_columns(table_name)
            ]
            rows = db.execute(
                text(f'SELECT * FROM "{table_name}" LIMIT 3')
            ).mappings()
            muestras[table_name] = [
                {key: str(value) if value is not None else None for key, value in row.items()}
                for row in rows
            ]
    return {
        "faltantes": missing_runtime_tables(bind),
        "columnas_faltantes": drift,
        "columnas_actuales": columnas_actuales,
        "muestras": muestras,
        "conteos": conteos,
    }
