"""Registra la promoción aplicada a cada detalle de pedido.

Revision ID: c4e8a91d7b20
Revises: b91d7e4c2f63
Create Date: 2026-07-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4e8a91d7b20"
down_revision: Union[str, Sequence[str], None] = "b91d7e4c2f63"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "detalle_pedido_promocion",
        sa.Column("id_detalle", sa.Integer(), nullable=False),
        sa.Column("id_promocion", sa.Integer(), nullable=False),
        sa.Column("precio_original", sa.Numeric(10, 2), nullable=False),
        sa.Column("precio_aplicado", sa.Numeric(10, 2), nullable=False),
        sa.Column("descuento", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "precio_original >= 0",
            name="ck_detalle_promocion_precio_original",
        ),
        sa.CheckConstraint(
            "precio_aplicado >= 0",
            name="ck_detalle_promocion_precio_aplicado",
        ),
        sa.CheckConstraint(
            "descuento >= 0",
            name="ck_detalle_promocion_descuento",
        ),
        sa.ForeignKeyConstraint(
            ["id_detalle"],
            ["detalle_pedido.id_detalle"],
            name="fk_detalle_promocion_detalle",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_promocion"],
            ["promocion.id_promocion"],
            name="fk_detalle_promocion_promocion",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id_detalle"),
    )
    op.create_index(
        "ix_detalle_pedido_promocion_id_promocion",
        "detalle_pedido_promocion",
        ["id_promocion"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_detalle_pedido_promocion_id_promocion",
        table_name="detalle_pedido_promocion",
    )
    op.drop_table("detalle_pedido_promocion")
