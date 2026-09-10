import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL


def _normalizar_database_url(url: str) -> str:
    """Normaliza la URL para serverless (Neon/Render/Vercel)."""
    if not url or "None" in url or url.strip() in {"postgresql://", "postgresql://None"}:
        raise RuntimeError(
            "DATABASE_URL no está configurada. "
            "En Vercel: Settings → Environment Variables → agrega DATABASE_URL "
            "(tu URL de Neon con ?sslmode=require)."
        )
    url = url.strip().strip('"').strip("'")
    # SQLAlchemy 2.x exige el esquema postgresql:// (algunos paneles dan postgres://)
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    # Neon exige SSL; si la URL no lo indica, forzar sslmode=require
    if url.startswith("postgresql://") and "sslmode=" not in url:
        separador = "&" if "?" in url else "?"
        url = f"{url}{separador}sslmode=require"
    return url


DATABASE_URL_NORMALIZADA = _normalizar_database_url(DATABASE_URL)

# En Vercel (serverless) no se debe mantener un pool persistente entre
# invocaciones: NullPool abre/cierra por request y evita
# "too many connections" en Neon (plan free). Local se mantiene el pool
# por defecto para mejor rendimiento.
if os.getenv("VERCEL"):
    engine = create_engine(
        DATABASE_URL_NORMALIZADA,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )
else:
    engine = create_engine(
        DATABASE_URL_NORMALIZADA,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def transaccion(db):
    """Confirma o revierte los cambios sobre la sesión.

    Compatible con sesiones que ya iniciaron una transacción (por ejemplo,
    después de que el dependency de autenticación consulte el usuario).
    """
    try:
        yield
        db.commit()
    except Exception:
        db.rollback()
        raise