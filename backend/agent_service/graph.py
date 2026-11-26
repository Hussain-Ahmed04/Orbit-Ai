from langchain_openai import ChatOpenAI
from common.config import settings
from langgraph.graph import MessagesState
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain_tavily import TavilySearch


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

async def chat_node(state: State):
    sys = SystemMessage('You are a helpful assistant. Be clear and concise.')
    return {'messages': [await deepseek.ainvoke([sys] + state['messages'])]}

search_agent = create_react_agent(
    deepseek, 
    [TavilySearch(max_results=4)],
    prompt='Search the web when facts may be recent. Cite source URLs.'
)