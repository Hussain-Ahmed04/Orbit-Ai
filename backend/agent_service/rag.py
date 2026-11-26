import asyncio, uuid, io
import boto3
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from qdrant_client import AsyncQdrantClient
from common.config import settings

COLLECTION = 'documents'

# Initialize Qdrant, OpenAI Embeddings, and AWS S3 clients
qdrant = AsyncQdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None)
emb = OpenAIEmbeddings(model='text-embedding-3-small', api_key=settings.openai_key)
s3 = boto3.client('s3', region_name=settings.aws_region)

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)