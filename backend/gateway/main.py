import httpx
import redis.asyncio as redis
from fastapi import FastAPI
from common.config import settings
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='gateway')

http = httpx.AsyncClient(timeout=None)
r = redis.from_url(settings.redis_url, decode_responses=True)

@app.get('/health')
async def health():
    return {'ok': True}



app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(','),
    allow_methods=['*'], 
    allow_headers=['*']
)

SERVICES = {
    'auth': settings.auth_url, 
    'chat': settings.chat_url,
    'agent': settings.agent_url, 
    'billing': settings.billing_url
}