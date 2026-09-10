from sqlalchemy import inspect, text

import app.models  # noqa: F401 - registra todo el metadata.
from app.database import Base, engine


REQUIRED_RUNTIME_TABLES = {
    "pedido_operacion",
    "insumo",
    "compra",
    "detalle_compra",
    "movimiento_inventario",
    "gasto",
    "promocion",
    "detalle_pedido_promocion",
    "notificacion",
    "notificacion_lectura",
    "evento_auditoria",
    "preferencia_negocio",
}


def missing_runtime_tables(bind=engine) -> list[str]:
    existentes = set(inspect(bind).get_table_names())
    return sorted(REQUIRED_RUNTIME_TABLES - existentes)


def runtime_schema_drift(bind=engine) -> dict[str, list[str]]:
    inspector = inspect(bind)
    existentes = set(inspector.get_table_names())
    drift = {}
    for table_name in sorted(REQUIRED_RUNTIME_TABLES & existentes):
        expected = set(Base.metadata.tables[table_name].columns.keys())
        actual = {column["name"] for column in inspector.get_columns(table_name)}
        missing = sorted(expected - actual)
        if missing:
            drift[table_name] = missing
    return drift


def ensure_runtime_schema(bind=engine) -> None:
    """Crea extensiones operativas faltantes sin alterar las tablas heredadas."""
    tablas_previas = set(inspect(bind).get_table_names())
    Base.metadata.create_all(bind=bind, checkfirst=True)

    # Una instalación que alcanzó a crear pedido_operacion con la primera
    # migración puede no tener todavía las columnas añadidas posteriormente.
    if bind.dialect.name == "postgresql":
        with bind.begin() as connection:
            connection.execute(text(
                "ALTER TABLE pedido_operacion "
                "ADD COLUMN IF NOT EXISTS demora_reportada_en TIMESTAMPTZ"
            ))
            connection.execute(text(
                "ALTER TABLE pedido_operacion "
                "ADD COLUMN IF NOT EXISTS nota_cocina TEXT"
            ))
            connection.execute(text(
                "INSERT INTO pedido_operacion (id_pedido, creado_en) "
                "SELECT id_pedido, COALESCE(fecha, CURRENT_TIMESTAMP) FROM pedido "
                "ON CONFLICT (id_pedido) DO NOTHING"
            ))
            connection.execute(text(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS folio VARCHAR(80)"
            ))
            connection.execute(text(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS estado VARCHAR(20) "
                "NOT NULL DEFAULT 'Recibida'"
            ))
            connection.execute(text(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS observaciones TEXT"
            ))
            connection.execute(text(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS recibido_en TIMESTAMPTZ"
            ))
            connection.execute(text(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ "
                "NOT NULL DEFAULT CURRENT_TIMESTAMP"
            ))
            connection.execute(text(
                "ALTER TABLE compra ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ "
                "NOT NULL DEFAULT CURRENT_TIMESTAMP"
            ))
            connection.execute(text(
                "UPDATE compra SET creado_en = COALESCE(fecha, creado_en), "
                "actualizado_en = COALESCE(fecha, actualizado_en), "
                "recibido_en = COALESCE(recibido_en, fecha)"
            ))

            connection.execute(text(
                "ALTER TABLE gasto ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(40)"
            ))
            connection.execute(text(
                "ALTER TABLE gasto ADD COLUMN IF NOT EXISTS comprobante VARCHAR(255)"
            ))
            connection.execute(text(
                "ALTER TABLE gasto ADD COLUMN IF NOT EXISTS activo BOOLEAN "
                "NOT NULL DEFAULT TRUE"
            ))
            connection.execute(text(
                "ALTER TABLE gasto ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ "
                "NOT NULL DEFAULT CURRENT_TIMESTAMP"
            ))
            connection.execute(text(
                "ALTER TABLE gasto ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ "
                "NOT NULL DEFAULT CURRENT_TIMESTAMP"
            ))
            connection.execute(text(
                "ALTER TABLE gasto ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ"
            ))
            connection.execute(text(
                "UPDATE gasto SET creado_en = COALESCE(fecha, creado_en), "
                "actualizado_en = COALESCE(fecha, actualizado_en)"
            ))

            if "ingrediente" in tablas_previas:
                connection.execute(text(
                    "INSERT INTO insumo ("
                    "id_insumo, nombre, descripcion, categoria, unidad_medida, "
                    "stock_actual, stock_minimo, activo, creado_en, actualizado_en"
                    ") SELECT id_ingrediente, nombre, NULL, 'General', unidad_medida, "
                    "stock, stock_minimo, activo, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP "
                    "FROM ingrediente ON CONFLICT (id_insumo) DO NOTHING"
                ))
                connection.execute(text(
                    "SELECT setval(pg_get_serial_sequence('insumo', 'id_insumo'), "
                    "GREATEST(COALESCE((SELECT MAX(id_insumo) FROM insumo), 1), 1), true)"
                ))
                connection.execute(text(
                    "ALTER TABLE detalle_compra ADD COLUMN IF NOT EXISTS id_insumo INTEGER"
                ))
                connection.execute(text(
                    "UPDATE detalle_compra SET id_insumo = id_ingrediente "
                    "WHERE id_insumo IS NULL"
                ))
                connection.execute(text(
                    "ALTER TABLE detalle_compra ALTER COLUMN id_insumo SET NOT NULL"
                ))
                connection.execute(text(
                    "CREATE INDEX IF NOT EXISTS ix_detalle_compra_id_insumo "
                    "ON detalle_compra (id_insumo)"
                ))
                connection.execute(text(
                    "DO $$ BEGIN "
                    "IF NOT EXISTS (SELECT 1 FROM pg_constraint "
                    "WHERE conname = 'fk_detalle_compra_insumo') THEN "
                    "ALTER TABLE detalle_compra ADD CONSTRAINT fk_detalle_compra_insumo "
                    "FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON DELETE RESTRICT; "
                    "END IF; END $$"
                ))

    faltantes = missing_runtime_tables(bind)
    if faltantes:
        raise RuntimeError(
            "No se pudieron preparar las tablas operativas: "
            + ", ".join(faltantes)
        )
    drift = runtime_schema_drift(bind)
    if drift:
        raise RuntimeError(f"El esquema operativo tiene columnas faltantes: {drift}")
