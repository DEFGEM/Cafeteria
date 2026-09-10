"""Crear tabla rol

Revision ID: c08a3e02f2e8
Revises: 
Create Date: 2026-07-02 02:20:57.775501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c08a3e02f2e8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea la tabla raíz de roles para instalaciones nuevas."""
    op.create_table(
        "rol",
        sa.Column("id_rol", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=30), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id_rol"),
        sa.UniqueConstraint("nombre"),
    )
    op.create_index(op.f("ix_rol_id_rol"), "rol", ["id_rol"], unique=False)


def downgrade() -> None:
    """Elimina la tabla raíz al volver al estado sin migraciones."""
    op.drop_index(op.f("ix_rol_id_rol"), table_name="rol")
    op.drop_table("rol")
