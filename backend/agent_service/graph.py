from langchain_openai import ChatOpenAI
from common.config import settings
from langgraph.graph import MessagesState


def model(name: str) -> ChatOpenAI:
    return ChatOpenAI(
        model=name, 
        base_url='https://openrouter.ai/api/v1',
        api_key=settings.openrouter_key, 
        streaming=True
    )

deepseek = model('deepseek/deepseek-chat')
gpt = model('openai/gpt-4o-mini') # vision and structured output

class State(MessagesState):
    agent: str
    user_id: str
    file_id: str | None
    image: str | None

def route(state: State) -> str:
    return state['agent']