import os
from typing import List

class Settings:
    PROJECT_NAME: str = "SkillForge API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")

settings = Settings()
