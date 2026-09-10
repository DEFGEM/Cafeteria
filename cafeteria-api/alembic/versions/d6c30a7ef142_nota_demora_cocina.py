"""Persiste las notas de demora reportadas por Cocina.

Revision ID: d6c30a7ef142
Revises: c4e8a91d7b20
Create Date: 2026-07-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d6c30a7ef142"
down_revision: Union[str, Sequence[str], None] = "c4e8a91d7b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "pedido_operacion",
        sa.Column("demora_reportada_en", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "pedido_operacion",
        sa.Column("nota_cocina", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("pedido_operacion", "nota_cocina")
    op.drop_column("pedido_operacion", "demora_reportada_en")
