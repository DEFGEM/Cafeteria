"""Integración core móvil mediante una extensión 1:1 de pedido.

Revision ID: a7f4e8c12d90
Revises: 6fb8c23e0923
Create Date: 2026-07-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7f4e8c12d90"
down_revision: Union[str, Sequence[str], None] = "6fb8c23e0923"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pedido_operacion",
        sa.Column("id_pedido", sa.Integer(), nullable=False),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "preparacion_iniciada_en",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("listo_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pagado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metodo_pago", sa.String(length=30), nullable=True),
        sa.Column("monto_recibido", sa.Numeric(10, 2), nullable=True),
        sa.Column("cambio", sa.Numeric(10, 2), nullable=True),
        sa.Column("referencia_pago", sa.String(length=120), nullable=True),
        sa.Column("id_usuario_caja", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "monto_recibido IS NULL OR monto_recibido >= 0",
            name="ck_pedido_operacion_monto_recibido_no_negativo",
        ),
        sa.CheckConstraint(
            "cambio IS NULL OR cambio >= 0",
            name="ck_pedido_operacion_cambio_no_negativo",
        ),
        sa.CheckConstraint(
            "metodo_pago IS NULL OR "
            "metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia')",
            name="ck_pedido_operacion_metodo_pago_valido",
        ),
        sa.ForeignKeyConstraint(
            ["id_pedido"],
            ["pedido.id_pedido"],
            name="fk_pedido_operacion_pedido",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario_caja"],
            ["usuario.id_usuario"],
            name="fk_pedido_operacion_usuario_caja",
        ),
        sa.PrimaryKeyConstraint("id_pedido", name="pk_pedido_operacion"),
    )
    op.create_index(
        "ix_pedido_operacion_creado_en",
        "pedido_operacion",
        ["creado_en"],
        unique=False,
    )
    op.create_index(
        "ix_pedido_operacion_id_usuario_caja",
        "pedido_operacion",
        ["id_usuario_caja"],
        unique=False,
    )

    # Crea una extensión para los pedidos previos sin escribir ni alterar pedido.
    op.execute(
        sa.text(
            "INSERT INTO pedido_operacion (id_pedido, creado_en) "
            "SELECT id_pedido, COALESCE(fecha, CURRENT_TIMESTAMP) FROM pedido"
        )
    )


def downgrade() -> None:
    op.drop_index(
        "ix_pedido_operacion_id_usuario_caja",
        table_name="pedido_operacion",
    )
    op.drop_index(
        "ix_pedido_operacion_creado_en",
        table_name="pedido_operacion",
    )
    op.drop_table("pedido_operacion")
