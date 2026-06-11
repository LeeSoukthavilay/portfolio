import os
import pytest
from rag import PortfolioRAG


@pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set; requires real OpenAI + Qdrant"
)
def test_rag_query_returns_sources():
    rag = PortfolioRAG()
    rag.ensure_collection()
    rag.index_documents([
        {"title": "Test", "content": "Lee is a senior full-stack developer with 4 years of experience.", "service": "test"}
    ])
    result = rag.query("What is Lee's experience?")
    assert "content" in result
    assert len(result["sources"]) > 0
