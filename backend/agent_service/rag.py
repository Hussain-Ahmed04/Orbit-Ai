import asyncio, uuid, io
import boto3
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from qdrant_client import AsyncQdrantClient
from common.config import settings
from qdrant_client.models import VectorParams, Distance

COLLECTION = 'documents'

# Initialize Qdrant, OpenAI Embeddings, and AWS S3 clients
qdrant = AsyncQdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None)
emb = OpenAIEmbeddings(model='text-embedding-3-small', api_key=settings.openai_key)
s3 = boto3.client('s3', region_name=settings.aws_region)

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)

async def ensure_collection():
    if not await qdrant.collection_exists(COLLECTION):
        await qdrant.create_collection(
            COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )

