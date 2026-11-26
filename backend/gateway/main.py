import httpx
import redis.asyncio as redis
from fastapi import FastAPI
from common.config import settings
from fastapi.middleware.cors import CORSMiddleware
import jwt
from fastapi import Request, HTTPException

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

async def authenticate(request: Request) -> str:
    token = request.headers.get('authorization', '').removeprefix('Bearer ').strip()
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=['HS256'])
    except jwt.PyJWTError:
        raise HTTPException(401, 'Invalid token')
        
    if not await r.exists(f'session:{token}'):
        raise HTTPException(401, 'Session expired')
        
    return claims['sub']

PUBLIC = {'auth/login'}
BLOCKED = {'billing/credits/deduct'} # internal only

SKIP_REQ = {'host', 'content-length', 'connection', 'x-user-id'}
SKIP_RES = {'transfer-encoding', 'connection'}