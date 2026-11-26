import asyncio, uuid, io
import boto3
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from qdrant_client import AsyncQdrantClient
from common.config import settings
from qdrant_client.models import VectorParams, Distance
from qdrant_client.models import PointStruct
from qdrant_client.models import Filter, FieldCondition, MatchValue

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

async def ingest(user_id: str, filename: str, data: bytes) -> str:
    file_id = uuid.uuid4().hex
    
    # Upload original PDF to S3 asynchronously
    await asyncio.to_thread(
        s3.put_object, 
        Bucket=settings.s3_bucket,
        Key=f'uploads/{user_id}/{file_id}.pdf', 
        Body=data
    )
    
    # Extract text from all pages
    text = '\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(data)).pages)
    
    # Split text into chunks
    chunks = splitter.split_text(text)

async def ingest(user_id: str, filename: str, data: bytes) -> str:
    file_id = uuid.uuid4().hex
    await asyncio.to_thread(s3.put_object, Bucket=settings.s3_bucket, Key=f'uploads/{user_id}/{file_id}.pdf', Body=data)
    text = '\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(data)).pages)
    chunks = splitter.split_text(text)
    
    # Generate vector embeddings
    vectors = await emb.aembed_documents(chunks)
    await ensure_collection()
    
    # Upsert points with payload metadata into Qdrant
    await qdrant.upsert(COLLECTION, points=[
        PointStruct(
            id=str(uuid.uuid4()), 
            vector=v,
            payload={'user_id': user_id, 'file_id': file_id, 'text': c}
        )
        for c, v in zip(chunks, vectors)
    ])
    return file_id


async def retrieve(user_id: str, file_id: str, question: str) -> str:
    qv = await emb.aembed_query(question)
    
    res = await qdrant.query_points(
        COLLECTION, 
        query=qv, 
        limit=4,
        query_filter=Filter(must=[
            FieldCondition(key='user_id', match=MatchValue(value=user_id)),
            FieldCondition(key='file_id', match=MatchValue(value=file_id))
        ])
    )
    
    return '\n---\n'.join(p.payload['text'] for p in res.points)
