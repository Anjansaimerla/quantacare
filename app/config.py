import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "QuantaCare Clinical Decision Support"
    VERSION: str = "1.0.0"
    PINECONE_API_KEY: str = os.getenv(
        "PINECONE_API_KEY", 
        "pcsk_jxAwc_SExKzwcVdo6d5nEz7bTgTy44yRAppkcqysyUCqCU6dn13iK1RuPHjc8AYgSAXxd"
    )
    PINECONE_INDEX_NAME: str = "quantacare-clinical-vectors"
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
    VECTOR_DIMENSION: int = 6

settings = Settings()
