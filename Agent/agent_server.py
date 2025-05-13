import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from lightrag import LightRAG, QueryParam
from lightrag.llm.openai import openai_embed, openai_complete_if_cache
from lightrag.utils import setup_logger, EmbeddingFunc
from lightrag.types import GPTKeywordExtractionFormat
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from asyncio import Queue

stream_queue = Queue()

# Initialize FastAPI app
app = FastAPI(title="Literature Survey Generator")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ideally restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logger and constants
setup_logger("lightrag", level="INFO")
WORKING_DIR = "/Users/subhailamathy/Documents/MS/Sp25/CS532/Project/LightRAG/new_working_md_9_papers"

# Load prompt from file
with open("prompt.txt", "r") as f:
    prompt = f.read()

# Initialize OpenAI model
openai_model = OpenAIModel('gpt-4.1', provider=OpenAIProvider(api_key=openai_api_key))

def openai_alike_model_complete(
        prompt,
        system_prompt=None,
        history_messages=None,
        keyword_extraction=False,
        **kwargs,
    ) -> str:
        keyword_extraction = kwargs.pop("keyword_extraction", None)
        if keyword_extraction:
            kwargs["response_format"] = GPTKeywordExtractionFormat
        if history_messages is None:
            history_messages = []
        kwargs["temperature"] = 0.7
        return openai_complete_if_cache(
            "gpt-4.1-nano",
            prompt,
            system_prompt=system_prompt,
            history_messages=history_messages,
            base_url="https://api.openai.com/v1",
            api_key=openai_api_key,
            **kwargs,
        )

embedding_func = EmbeddingFunc(
        embedding_dim=1536,
        max_token_size=1200,
        func = lambda texts: openai_embed(
            texts,
            model="text-embedding-3-small",
            base_url="https://api.openai.com/v1",
            api_key=openai_api_key,
        ),
    )


import asyncio
import requests

# def ollama_embed(texts, model="nomic-embed-text", host="http://localhost:11434"):
#     results = []
#     for text in texts:
#         response = requests.post(
#             f"{host}/api/embeddings",
#             json={"model": model, "prompt": text}
#         )
#         response.raise_for_status()
#         embedding = response.json().get("embedding")
#         if not embedding:
#             raise ValueError("No embedding returned")
#         results.append(embedding)
#     return results

# async def async_ollama_embed(texts):
#     return await asyncio.to_thread(ollama_embed, texts)

# embedding_func = EmbeddingFunc(
#     embedding_dim=768,
#     max_token_size=1200,
#     func=async_ollama_embed
# )


def initialize_rag():
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=openai_alike_model_complete,
        embedding_func=embedding_func,
        )
    return rag

def initialize_scratchpad(): 
    # Create a scratchpad file if it doesn't exist
    if not os.path.exists("scratchpad.txt"):
        with open("scratchpad.txt", "w") as f:
            f.write("")

# Initialize RAG instance and scratchpad
rag = initialize_rag()
initialize_scratchpad()

research_agent = Agent(
    model=openai_model,
    system_prompt= f"""You are an AI research agent tasked with writing comprehensive, critical literature surveys. You have access to an oracle connected to a knowledge graph built from research papers. The oracle can retrieve information from these papers but doesn't analyze it. Your job is to query the oracle strategically, analyze information critically, and synthesize a thoughtful literature survey that identifies gaps and future directions."""
)
from typing import AsyncGenerator

from asyncio import Queue

stream_queue = Queue()

@research_agent.tool_plain
async def query_knowledge_base(queries: List[str]) -> List[str]:
    global rag
    responses = []

    for query in queries:
        # Only 1 query expected in your case
        await stream_queue.put(f"{query}")
        try:
            response = await rag.aquery(query, param=QueryParam(mode="hybrid"))
            # await stream_queue.put(f"Oracle response received with {len(response)} characters")
            responses.append(response)
        except Exception as e:
            await stream_queue.put(f"[ERROR] {str(e)}")
            responses.append(f"[ERROR] {str(e)}")

    return responses



@research_agent.tool_plain  
def write_to_scratchpad(text: str) -> int:
    """
    Write text to the scratchpad.
    Args:
        text (str): Text to write to the scratchpad.
    
    Returns:
        int: 1 if successful
    """
    with open("scratchpad.txt", "a") as f:
        f.write(text + "\n")
    
    print(f"tool call ==> write_to_scratchpad")
    return 1

@research_agent.tool_plain  
def read_from_scratchpad() -> str:
    """
    Read the contents of the scratchpad.
    Returns:
        str: Contents of the scratchpad.
    """
    with open("scratchpad.txt", "r") as f:
        scratchpad = f.read()
    
    print(f"tool call ==> read_from_scratchpad")
    return scratchpad

# Define request model
class SurveyRequest(BaseModel):
    query: str 

# Define response model
class SurveyResponse(BaseModel):
    status: str
    output: str

from fastapi.responses import StreamingResponse
import json

@app.post("/generate_survey")
async def generate_survey(request: SurveyRequest):
    async def stream_response():
        try:
            full_prompt = f"{prompt}\n\nUSER QUERY:\n{request.query}"

            # Start background agent task
            task = asyncio.create_task(research_agent.run(full_prompt))

            # While agent is running, yield messages from the stream queue
            while not task.done() or not stream_queue.empty():
                try:
                    msg = await asyncio.wait_for(stream_queue.get(), timeout=1.0)
                    yield json.dumps({"response": msg}) + "\n"
                except asyncio.TimeoutError:
                    continue

            # Final result from the agent
            result = await task
            yield json.dumps({"response": result.output}) + "\n"

        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(stream_response(), media_type="application/x-ndjson")
# Run the FastAPI app
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8001)