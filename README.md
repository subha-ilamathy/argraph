# 🧠 ArGraph: Conversational AI Research Assistant

![ArGraph Banner](./README.assets/argraph_banner.png)

ArGraph is a full-stack conversational research assistant powered by Large Language Models (LLMs) and knowledge graphs. It enables users to upload domain-specific documents (e.g., PDFs or text), dynamically build an entity-based graph, and interact with an AI assistant to explore the research context using chain-of-thought reasoning.

---

## 🚀 Features

- 📄 Upload research papers to auto-generate a knowledge graph
- 🧠 LLM-based multi-turn question answering using structured retrieval
- 🔍 Visualize nodes, entities, and relationships in real-time
- 🗂️ Persistent vector storage with retrieval-augmented generation (RAG)
- 💬 Streamed chat interface with context-aware prompts
- 🌐 Built with modern, scalable full-stack architecture

---

## ⚙️ Tech Stack

- **Frontend:** React, TypeScript, D3.js
- **Backend:** FastAPI, Python, LangChain
- **LLMs:** OpenAI GPT-4, LLaMA 3
- **Graph DB:** Neo4j
- **Vector DB:** FAISS / pgVector
- **Other:** Docker, GitHub Actions, Streamlit for testing

---

## 🧪 Local Setup

```bash
git clone https://github.com/subha-ilamathy/argraph.git
cd argraph
docker-compose up --build
```
