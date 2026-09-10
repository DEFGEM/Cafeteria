import json
import os

from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = (
        f"postgresql://{DB_USER}:{DB_PASSWORD}@"
        f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


def _parse_cors_origins(value: str | None) -> list[str]:
    """Acepta CORS_ORIGINS como JSON o como una lista separada por comas."""

    if not value:
        return [
            "http://localhost:19006",
            "http://localhost:8081",
            "http://localhost:3000",
            "http://127.0.0.1:19006",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:3000",
        ]

    value = value.strip()

    if value.startswith("["):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "CORS_ORIGINS debe ser JSON válido o una lista separada por comas."
            ) from exc

        if not isinstance(parsed, list) or not all(
            isinstance(origin, str) for origin in parsed
        ):
            raise ValueError("CORS_ORIGINS debe contener una lista de URLs.")

        origins = parsed
    else:
        origins = value.split(",")

    parsed_origins = [
        origin.strip().rstrip("/") for origin in origins if origin.strip()
    ]
    if "*" in parsed_origins:
        raise ValueError(
            "CORS_ORIGINS debe enumerar orígenes explícitos; '*' no está permitido."
        )
    return parsed_origins


CORS_ORIGINS = _parse_cors_origins(os.getenv("CORS_ORIGINS"))
