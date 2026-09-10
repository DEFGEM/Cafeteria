from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.schema_runtime import ensure_runtime_schema, missing_runtime_tables


if __name__ == "__main__":
    ensure_runtime_schema()
    print("Esquema operativo listo.")
    print(f"Tablas faltantes: {missing_runtime_tables()}")
