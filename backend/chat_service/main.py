import json, httpx
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from common.config import settings
from pydantic import BaseModel

app = FastAPI(title='chat')
db = AsyncIOMotorClient(settings.mongo_url)[settings.db_name]


# Example credit costs per agent type
COST = {'chat': 1, 'agent': 5, 'vision': 3}

class MessageIn(BaseModel):
    content: str
    agent: str = 'chat'
    file_id: str | None = None
    image: str | None = None # data URL for the vision agent