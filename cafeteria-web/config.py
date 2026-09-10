import os

from dotenv import load_dotenv

load_dotenv()


def normalize_api_url(value):
    value = value.rstrip("/")
    if not value.startswith(("http://", "https://")):
        value = f"http://{value}"
    return value


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")

    API_URL = normalize_api_url(os.getenv("API_URL", "http://127.0.0.1:8000"))
