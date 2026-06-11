import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag import PortfolioRAG
from seed import SEED_DOCUMENTS

rag: PortfolioRAG | None = None


def get_rag() -> PortfolioRAG:
    global rag
    if rag is None:
        rag = PortfolioRAG()
    return rag


@asynccontextmanager
async def lifespan(app: FastAPI):
    r = get_rag()
    r.ensure_collection()
    r.index_documents(SEED_DOCUMENTS)
    yield


app = FastAPI(title="Portfolio AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatSource(BaseModel):
    title: str
    excerpt: str
    service: str


class ChatResponse(BaseModel):
    content: str
    sources: list[ChatSource]


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        result = get_rag().query(request.message)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "model": "deepseek-chat", "embeddings": "all-MiniLM-L6-v2"}
