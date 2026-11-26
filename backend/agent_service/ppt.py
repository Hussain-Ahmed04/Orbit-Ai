from pydantic import BaseModel

class Slide(BaseModel):
    title: str
    bullets: list[str]

class Deck(BaseModel):
    slides: list[Slide]