from pydantic import BaseModel
import asyncio, io, uuid
from pptx import Presentation
from .graph import gpt
from .rag import s3
from common.config import settings

class Slide(BaseModel):
    title: str
    bullets: list[str]

class Deck(BaseModel):
    slides: list[Slide]

async def build_deck(topic: str, user_id: str) -> str:
    deck = await gpt.with_structured_output(Deck).ainvoke(
        'Create a 6-8 slide presentation outline with 3-5 short bullets per slide on: ' + topic
    )
    
    prs = Presentation()
    for s in deck.slides:
        slide = prs.slides.add_slide(prs.slide_layouts[1])
        slide.shapes.title.text = s.title
        tf = slide.placeholders[1].text_frame
        tf.text = s.bullets[0] if s.bullets else ''
        for b in s.bullets[1:]:
            tf.add_paragraph().text = b
            
    buf = io.BytesIO()
    prs.save(buf)
    
    key = f'decks/{user_id}/{uuid.uuid4().hex}.pptx'
    await asyncio.to_thread(
        s3.put_object, 
        Bucket=settings.s3_bucket,
        Key=key, 
        Body=buf.getvalue()
    )
    
    return await asyncio.to_thread(
            s3.generate_presigned_url, 
            'get_object',
            Params={'Bucket': settings.s3_bucket, 'Key': key}, 
            ExpiresIn=3600
        )