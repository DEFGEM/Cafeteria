from pydantic import BaseModel, Field


class CategoriaBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=1000)

class CategoriaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str = Field(max_length=1000)

class CategoriaUpdate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str = Field(max_length=1000)

class CategoriaResponse(BaseModel):

    id_categoria: int
    nombre: str
    descripcion: str | None

    total_productos: int = 0

    model_config = {
        "from_attributes": True
    }

class CategoriaSimple(BaseModel):

    id_categoria: int
    nombre: str

    model_config = {
        "from_attributes": True
    }
