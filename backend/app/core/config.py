from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Job Matching Platform"
    DATABASE_URL: str
    REDIS_URL: str = "redis://redis:6379/0"
    OPENAI_API_KEY: str = "dummy_key_to_prevent_crash"
    JSEARCH_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
