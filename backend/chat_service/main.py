import json, httpx
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from common.config import settings

app = FastAPI(title='chat')
db = AsyncIOMotorClient(settings.mongo_url)[settings.db_name]