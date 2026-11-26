import time
import jwt
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from common.config import settings

# Initialize Firebase Admin SDK
firebase_admin.initialize_app(credentials.Certificate(settings.firebase_cred_path))

app = FastAPI(title='auth')

# Initialize Redis and MongoDB async clients
r = redis.from_url(settings.redis_url, decode_responses=True)
users = AsyncIOMotorClient(settings.mongo_url)[settings.db_name].users

@app.get('/health')
async def health():
    return {'ok': True}