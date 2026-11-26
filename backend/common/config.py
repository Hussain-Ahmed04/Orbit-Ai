from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    jwt_secret: str
    jwt_ttl: int = 60 * 60 * 24 * 7
    mongo_url: str = 'mongodb://localhost:27017'
    db_name: str = 'agentic'
    redis_url: str = 'redis://localhost:6379'
    qdrant_url: str = 'http://localhost:6333'
    qdrant_api_key: str = ''
    openrouter_key: str = ''
    openai_key: str = ''
    tavily_api_key: str = ''
    firebase_cred_path: str = 'firebase.json'
    razorpay_key_id: str = ''
    razorpay_key_secret: str = ''
    aws_region: str = 'ap-south-1'
    s3_bucket: str = ''
    cors_origins: str = 'http://localhost:5173'
    auth_url: str = 'http://auth:8000'
    chat_url: str = 'http://chat:8000'
    agent_url: str = 'http://agent:8000'
    billing_url: str = 'http://billing:8000'
    
settings = Settings()
