from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)

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