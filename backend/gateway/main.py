import httpx
import redis.asyncio as redis
from fastapi import FastAPI
from common.config import settings
from fastapi.middleware.cors import CORSMiddleware
import jwt
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

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


@app.api_route('/api/{service}/{path:path}', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
async def proxy(service: str, path: str, request: Request):
    base = SERVICES.get(service)
    if not base:
        raise HTTPException(404, 'Unknown service')
        
    key = f'{service}/{path}'
    if key in BLOCKED:
        raise HTTPException(403, 'Forbidden')
        
    headers = {k: v for k, v in request.headers.items() if k.lower() not in SKIP_REQ}
    
    if key not in PUBLIC:
        headers['x-user-id'] = await authenticate(request)
        
    req = http.build_request(
        request.method, f'{base}/{path}',
        params=request.query_params, 
        headers=headers,
        content=await request.body()
    )
    
    resp = await http.send(req, stream=True)
    
    return StreamingResponse(
        resp.aiter_raw(), 
        status_code=resp.status_code,
        headers={k: v for k, v in resp.headers.items() if k.lower() not in SKIP_RES},
        background=BackgroundTask(resp.aclose)
    )