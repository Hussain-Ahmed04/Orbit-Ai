import json, httpx
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from common.config import settings
from pydantic import BaseModel
from datetime import datetime, timezone
from fastapi import Depends, HTTPException
from common.deps import get_user_id

app = FastAPI(title='chat')
db = AsyncIOMotorClient(settings.mongo_url)[settings.db_name]


# Example credit costs per agent type
COST = {'chat': 1, 'agent': 5, 'vision': 3}

class MessageIn(BaseModel):
    content: str
    agent: str = 'chat'
    file_id: str | None = None
    image: str | None = None # data URL for the vision agent
    
@app.post('/chats/{chat_id}/messages')
async def send(chat_id: str, body: MessageIn, uid: str = Depends(get_user_id)):
    async with httpx.AsyncClient() as c:
        paid = await c.post(
            f'{settings.billing_url}/credits/deduct',
            json={'amount': COST.get(body.agent, 1)}, 
            headers={'X-User-Id': uid}
        )
        if paid.status_code == 402:
            raise HTTPException(402, 'Not enough credits')
            
    now = lambda: datetime.now(timezone.utc)
    
    await db.messages.insert_one({
        'chat_id': chat_id, 
        'user_id': uid, 
        'role': 'user',
        'content': body.content, 
        'agent': body.agent, 
        'created_at': now()
    })