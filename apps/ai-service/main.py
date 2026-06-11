import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from seed import SEED_DOCUMENTS

rag: object | None = None
rag_available: bool = False


def init_rag():
    global rag, rag_available
    try:
        from rag import PortfolioRAG
        r = PortfolioRAG()
        r.ensure_collection()
        r.index_documents(SEED_DOCUMENTS)
        rag = r
        rag_available = True
        print("RAG initialized successfully")
    except Exception as e:
        print(f"RAG unavailable (Qdrant not reachable): {e}")
        rag_available = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_rag()
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
    if rag_available and rag is not None:
        from rag import PortfolioRAG
        try:
            result = rag.query(request.message)  # type: ignore
            return ChatResponse(**result)
        except Exception as e:
            print(f"RAG query failed, falling back: {e}")

    # Fallback: direct LLM call without RAG context
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate

        api_key = os.getenv("DEEPSEEK_API_KEY", "")
        llm = ChatOpenAI(
            base_url="https://api.deepseek.com/v1",
            api_key=api_key,
            model="deepseek-chat",
            temperature=0.3,
        )
        prompt = ChatPromptTemplate.from_template(
            """You are a knowledgeable assistant answering questions about Lee's engineering portfolio.
Lee is Sengdavone Soukthavilay, a Senior Full-Stack Developer with 4 years of experience.
His expertise includes: FIX Protocol trading systems, payment gateways, e-commerce microservices,
telemedicine platforms, AI-assisted engineering, and Rust performance benchmarking.
Technologies: TypeScript, Golang, Rust, Bun, Next.js, Flutter, PostgreSQL, Kafka, RabbitMQ.

Answer the question helpfully. If you don't know something, suggest what the visitor might want to know about.

Question: {question}

Answer:"""
        )
        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke(request.message)

        return ChatResponse(content=answer, sources=[])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "deepseek-chat",
        "embeddings": "all-MiniLM-L6-v2",
        "rag": "available" if rag_available else "unavailable",
    }
