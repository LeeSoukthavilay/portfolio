import os
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension


class PortfolioRAG:
    def __init__(self):
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", "dev_key")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
        self.collection_name = "portfolio_content"

        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        self.llm = ChatOpenAI(
            base_url="https://api.deepseek.com/v1",
            api_key=self.deepseek_api_key,
            model="deepseek-chat",
            temperature=0.3,
        )
        self.client = QdrantClient(url=self.qdrant_url, api_key=self.qdrant_api_key, https=False)

    def ensure_collection(self):
        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
            )

    def index_documents(self, documents: list[dict[str, str]]):
        self.ensure_collection()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        texts = []
        metadatas = []
        for doc in documents:
            chunks = text_splitter.split_text(doc["content"])
            for chunk in chunks:
                texts.append(chunk)
                metadatas.append({"title": doc["title"], "service": doc.get("service", "portfolio")})

        vector_store = QdrantVectorStore(
            client=self.client, collection_name=self.collection_name, embedding=self.embeddings,
        )
        vector_store.add_texts(texts=texts, metadatas=metadatas)

    def query(self, question: str) -> dict:
        vector_store = QdrantVectorStore(
            client=self.client, collection_name=self.collection_name, embedding=self.embeddings,
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})

        prompt = ChatPromptTemplate.from_template(
            """You are a knowledgeable assistant answering questions about Lee's engineering portfolio.
Use the following retrieved context to answer the question.

If the context does not contain enough information to answer, say "I don't have enough information about that yet" and suggest what the visitor might want to know about.

Context:
{context}

Question: {question}

Answer:"""
        )

        chain = (
            {"context": retriever | self._format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        retrieved = retriever.invoke(question)
        answer = chain.invoke(question)

        return {
            "content": answer,
            "sources": [
                {
                    "title": doc.metadata.get("title", "Unknown"),
                    "excerpt": doc.page_content[:200],
                    "service": doc.metadata.get("service", "portfolio"),
                }
                for doc in retrieved
            ],
        }

    @staticmethod
    def _format_docs(docs):
        return "\n\n".join(f"[{doc.metadata.get('title', '')}] {doc.page_content}" for doc in docs)
