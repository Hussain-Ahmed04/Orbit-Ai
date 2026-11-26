import httpx
import redis.asyncio as redis
from fastapi import FastAPI
from common.config import settings

app = FastAPI(title='gateway')

http = httpx.AsyncClient(timeout=None)
r = redis.from_url(settings.redis_url, decode_responses=True)

@app.get('/health')
async def health():
    return {'ok': True}