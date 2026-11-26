import json
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from common.deps import get_user_id
from .graph import graph
from fastapi import UploadFile, File
from . import rag

app = FastAPI(title='agent')

class RunIn(BaseModel):
    messages: list[dict]
    agent: str = 'chat'
    file_id: str | None = None
    image: str | None = None

def frame(obj: dict) -> str:
    return 'data: ' + json.dumps(obj) + '\n\n'

@app.get('/health')
async def health():
    return {'ok': True}

@app.post('/run')
async def run(body: RunIn, uid: str = Depends(get_user_id)):
    state = {
        'messages': [(m['role'], m['content']) for m in body.messages],
        'agent': body.agent, 
        'user_id': uid,
        'file_id': body.file_id, 
        'image': body.image
    }
    
    async def gen():
        async for ev in graph.astream_events(state, version='v2'):
            if ev['event'] == 'on_chat_model_stream':
                text = ev['data']['chunk'].content
                if text:
                    yield frame({'type': 'token', 'text': text})
            elif ev['event'] == 'on_chain_end' and ev['name'] == 'ppt':
                yield frame({'type': 'token', 'text': ev['data']['output']['messages'][0].content})
                
        yield frame({'type': 'done'})
        
    return StreamingResponse(gen(), media_type='text/event-stream')

@app.post('/pdf/upload')
async def upload(file: UploadFile = File(...), uid: str = Depends(get_user_id)):
    file_id = await rag.ingest(uid, file.filename, await file.read())
    return {'file_id': file_id, 'name': file.filename}
