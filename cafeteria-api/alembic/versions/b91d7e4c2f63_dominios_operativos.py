"""Dominios operativos: inventario, compras, gastos y gestión.

Revision ID: b91d7e4c2f63
Revises: a7f4e8c12d90
Create Date: 2026-07-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b91d7e4c2f63"
down_revision: Union[str, Sequence[str], None] = "a7f4e8c12d90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "insumo",
        sa.Column("id_insumo", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("categoria", sa.String(length=80), nullable=False),
        sa.Column("unidad_medida", sa.String(length=30), nullable=False),
        sa.Column("stock_actual", sa.Numeric(12, 3), nullable=False),
        sa.Column("stock_minimo", sa.Numeric(12, 3), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "stock_actual >= 0",
            name="ck_insumo_stock_no_negativo",
        ),
        sa.CheckConstraint(
            "stock_minimo >= 0",
            name="ck_insumo_minimo_no_negativo",
        ),
        sa.PrimaryKeyConstraint("id_insumo"),
    )
    op.create_index("ix_insumo_id_insumo", "insumo", ["id_insumo"], unique=False)
    op.create_index("ix_insumo_nombre", "insumo", ["nombre"], unique=True)

    op.create_table(
        "compra",
        sa.Column("id_compra", sa.Integer(), nullable=False),
        sa.Column("proveedor", sa.String(length=120), nullable=False),
        sa.Column("folio", sa.String(length=80), nullable=True),
        sa.Column(
            "fecha",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("estado", sa.String(length=20), nullable=False),
        sa.Column("total", sa.Numeric(12, 2), nullable=False),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.Column("recibido_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "total >= 0",
            name="ck_compra_total_no_negativo",
        ),
        sa.CheckConstraint(
            "estado IN ('Pendiente', 'Recibida', 'Cancelada')",
            name="ck_compra_estado_valido",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuario.id_usuario"],
            name="fk_compra_usuario",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id_compra"),
        sa.UniqueConstraint("folio", name="uq_compra_folio"),
    )
    op.create_index("ix_compra_estado", "compra", ["estado"], unique=False)
    op.create_index("ix_compra_id_compra", "compra", ["id_compra"], unique=False)

    op.create_table(
        "detalle_compra",
        sa.Column("id_detalle_compra", sa.Integer(), nullable=False),
        sa.Column("cantidad", sa.Numeric(12, 3), nullable=False),
        sa.Column("costo_unitario", sa.Numeric(12, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("id_compra", sa.Integer(), nullable=False),
        sa.Column("id_insumo", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "cantidad > 0",
            name="ck_detalle_compra_cantidad_positiva",
        ),
        sa.CheckConstraint(
            "costo_unitario >= 0",
            name="ck_detalle_compra_costo_no_negativo",
        ),
        sa.ForeignKeyConstraint(
            ["id_compra"],
            ["compra.id_compra"],
            name="fk_detalle_compra_compra",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_insumo"],
            ["insumo.id_insumo"],
            name="fk_detalle_compra_insumo",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id_detalle_compra"),
    )
    op.create_index(
        "ix_detalle_compra_id_compra",
        "detalle_compra",
        ["id_compra"],
        unique=False,
    )
    op.create_index(
        "ix_detalle_compra_id_detalle_compra",
        "detalle_compra",
        ["id_detalle_compra"],
        unique=False,
    )
    op.create_index(
        "ix_detalle_compra_id_insumo",
        "detalle_compra",
        ["id_insumo"],
        unique=False,
    )

    op.create_table(
        "movimiento_inventario",
        sa.Column("id_movimiento", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("cantidad", sa.Numeric(12, 3), nullable=False),
        sa.Column("stock_anterior", sa.Numeric(12, 3), nullable=False),
        sa.Column("stock_posterior", sa.Numeric(12, 3), nullable=False),
        sa.Column("motivo", sa.Text(), nullable=False),
        sa.Column("referencia", sa.String(length=120), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("id_insumo", sa.Integer(), nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=True),
        sa.Column("id_compra", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "cantidad >= 0",
            name="ck_movimiento_cantidad_no_negativa",
        ),
        sa.CheckConstraint(
            "stock_anterior >= 0",
            name="ck_movimiento_stock_anterior",
        ),
        sa.CheckConstraint(
            "stock_posterior >= 0",
            name="ck_movimiento_stock_posterior",
        ),
        sa.CheckConstraint(
            "tipo IN ('Entrada', 'Salida', 'Ajuste')",
            name="ck_movimiento_tipo_valido",
        ),
        sa.ForeignKeyConstraint(
            ["id_compra"],
            ["compra.id_compra"],
            name="fk_movimiento_inventario_compra",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["id_insumo"],
            ["insumo.id_insumo"],
            name="fk_movimiento_inventario_insumo",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuario.id_usuario"],
            name="fk_movimiento_inventario_usuario",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id_movimiento"),
    )
    op.create_index(
        "ix_movimiento_inventario_id_compra",
        "movimiento_inventario",
        ["id_compra"],
        unique=False,
    )
    op.create_index(
        "ix_movimiento_inventario_id_insumo",
        "movimiento_inventario",
        ["id_insumo"],
        unique=False,
    )
    op.create_index(
        "ix_movimiento_inventario_id_movimiento",
        "movimiento_inventario",
        ["id_movimiento"],
        unique=False,
    )
    op.create_index(
        "ix_movimiento_inventario_id_usuario",
        "movimiento_inventario",
        ["id_usuario"],
        unique=False,
    )
    op.create_index(
        "ix_movimiento_inventario_tipo",
        "movimiento_inventario",
        ["tipo"],
        unique=False,
    )

    op.create_table(
        "gasto",
        sa.Column("id_gasto", sa.Integer(), nullable=False),
        sa.Column("categoria", sa.String(length=80), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "fecha",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("metodo_pago", sa.String(length=40), nullable=True),
        sa.Column("comprobante", sa.String(length=255), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("eliminado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.CheckConstraint("monto > 0", name="ck_gasto_monto_positivo"),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuario.id_usuario"],
            name="fk_gasto_usuario",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id_gasto"),
    )
    op.create_index("ix_gasto_categoria", "gasto", ["categoria"], unique=False)
    op.create_index("ix_gasto_id_gasto", "gasto", ["id_gasto"], unique=False)
    op.create_index("ix_gasto_id_usuario", "gasto", ["id_usuario"], unique=False)

    op.create_table(
        "promocion",
        sa.Column("id_promocion", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("valor", sa.Numeric(12, 2), nullable=False),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("id_producto", sa.Integer(), nullable=True),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.CheckConstraint("valor > 0", name="ck_promocion_valor_positivo"),
        sa.CheckConstraint(
            "fecha_fin > fecha_inicio",
            name="ck_promocion_vigencia_valida",
        ),
        sa.CheckConstraint(
            "tipo IN ('Porcentaje', 'Monto', 'Precio fijo')",
            name="ck_promocion_tipo_valido",
        ),
        sa.ForeignKeyConstraint(
            ["id_producto"],
            ["producto.id_producto"],
            name="fk_promocion_producto",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuario.id_usuario"],
            name="fk_promocion_usuario",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id_promocion"),
    )
    op.create_index("ix_promocion_activo", "promocion", ["activo"], unique=False)
    op.create_index(
        "ix_promocion_id_producto",
        "promocion",
        ["id_producto"],
        unique=False,
    )
    op.create_index(
        "ix_promocion_id_promocion",
        "promocion",
        ["id_promocion"],
        unique=False,
    )

    op.create_table(
        "notificacion",
        sa.Column("id_notificacion", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(length=140), nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("tipo", sa.String(length=50), nullable=False),
        sa.Column("severidad", sa.String(length=20), nullable=False),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("expira_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id_usuario_destino", sa.Integer(), nullable=True),
        sa.Column("rol_destino", sa.String(length=30), nullable=True),
        sa.Column("id_usuario_creador", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_usuario_creador"],
            ["usuario.id_usuario"],
            name="fk_notificacion_usuario_creador",
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario_destino"],
            ["usuario.id_usuario"],
            name="fk_notificacion_usuario_destino",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id_notificacion"),
    )
    op.create_index(
        "ix_notificacion_id_notificacion",
        "notificacion",
        ["id_notificacion"],
        unique=False,
    )
    op.create_index(
        "ix_notificacion_id_usuario_destino",
        "notificacion",
        ["id_usuario_destino"],
        unique=False,
    )
    op.create_index(
        "ix_notificacion_rol_destino",
        "notificacion",
        ["rol_destino"],
        unique=False,
    )
    op.create_index(
        "ix_notificacion_tipo",
        "notificacion",
        ["tipo"],
        unique=False,
    )

    op.create_table(
        "notificacion_lectura",
        sa.Column("id_lectura", sa.Integer(), nullable=False),
        sa.Column(
            "leida_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("id_notificacion", sa.Integer(), nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["id_notificacion"],
            ["notificacion.id_notificacion"],
            name="fk_notificacion_lectura_notificacion",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuario.id_usuario"],
            name="fk_notificacion_lectura_usuario",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id_lectura"),
        sa.UniqueConstraint(
            "id_notificacion",
            "id_usuario",
            name="uq_notificacion_lectura_usuario",
        ),
    )
    op.create_index(
        "ix_notificacion_lectura_id_lectura",
        "notificacion_lectura",
        ["id_lectura"],
        unique=False,
    )
    op.create_index(
        "ix_notificacion_lectura_id_notificacion",
        "notificacion_lectura",
        ["id_notificacion"],
        unique=False,
    )
    op.create_index(
        "ix_notificacion_lectura_id_usuario",
        "notificacion_lectura",
        ["id_usuario"],
        unique=False,
    )

    op.create_table(
        "evento_auditoria",
        sa.Column("id_evento", sa.Integer(), nullable=False),
        sa.Column("modulo", sa.String(length=50), nullable=False),
        sa.Column("accion", sa.String(length=60), nullable=False),
        sa.Column("entidad", sa.String(length=60), nullable=True),
        sa.Column("id_entidad", sa.String(length=60), nullable=True),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("severidad", sa.String(length=20), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column(
            "creado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("id_usuario", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_usuario"],
            ["usuario.id_usuario"],
            name="fk_evento_auditoria_usuario",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id_evento"),
    )
    op.create_index(
        "ix_evento_auditoria_accion",
        "evento_auditoria",
        ["accion"],
        unique=False,
    )
    op.create_index(
        "ix_evento_auditoria_creado_en",
        "evento_auditoria",
        ["creado_en"],
        unique=False,
    )
    op.create_index(
        "ix_evento_auditoria_entidad",
        "evento_auditoria",
        ["entidad"],
        unique=False,
    )
    op.create_index(
        "ix_evento_auditoria_id_entidad",
        "evento_auditoria",
        ["id_entidad"],
        unique=False,
    )
    op.create_index(
        "ix_evento_auditoria_id_evento",
        "evento_auditoria",
        ["id_evento"],
        unique=False,
    )
    op.create_index(
        "ix_evento_auditoria_id_usuario",
        "evento_auditoria",
        ["id_usuario"],
        unique=False,
    )
    op.create_index(
        "ix_evento_auditoria_modulo",
        "evento_auditoria",
        ["modulo"],
        unique=False,
    )

    op.create_table(
        "preferencia_negocio",
        sa.Column("id_preferencia", sa.Integer(), nullable=False),
        sa.Column("clave", sa.String(length=100), nullable=False),
        sa.Column("valor", sa.JSON(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column(
            "actualizado_en",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("id_usuario_actualizacion", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["id_usuario_actualizacion"],
            ["usuario.id_usuario"],
            name="fk_preferencia_negocio_usuario",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id_preferencia"),
    )
    op.create_index(
        "ix_preferencia_negocio_clave",
        "preferencia_negocio",
        ["clave"],
        unique=True,
    )
    op.create_index(
        "ix_preferencia_negocio_id_preferencia",
        "preferencia_negocio",
        ["id_preferencia"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("preferencia_negocio")
    op.drop_table("evento_auditoria")
    op.drop_table("notificacion_lectura")
    op.drop_table("notificacion")
    op.drop_table("promocion")
    op.drop_table("gasto")
    op.drop_table("movimiento_inventario")
    op.drop_table("detalle_compra")
    op.drop_table("compra")
    op.drop_table("insumo")
