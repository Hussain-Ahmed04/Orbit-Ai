from langchain_openai import ChatOpenAI
from common.config import settings
from langgraph.graph import MessagesState
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain_tavily import TavilySearch
from langchain_core.messages import HumanMessage
from . import rag

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

CODING_PROMPT = (
    'You are a senior engineer. Reply with a short explanation and exactly one '
    'fenced code block (HTML, CSS and JS in a single file when it is a web page).'
)

async def coding_node(state: State):
    sys = SystemMessage(CODING_PROMPT)
    return {'messages': [await deepseek.ainvoke([sys] + state['messages'])]}


async def vision_node(state: State):
    question = state['messages'][-1].content
    msg = HumanMessage(content=[
        {'type': 'text', 'text': question},
        {'type': 'image_url', 'image_url': {'url': state['image']}}
    ])
    return {'messages': [await gpt.ainvoke(state['messages'][:-1] + [msg])]}


async def pdf_node(state: State):
    question = state['messages'][-1].content
    context = await rag.retrieve(state['user_id'], state['file_id'], question)
    sys = SystemMessage('Answer only from this document context. If it is not there, say so.\n\n' + context)
    return {'messages': [await deepseek.ainvoke([sys] + state['messages'])]}

