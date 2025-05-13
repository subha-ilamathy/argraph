### This is sample file of .env

### Directory Configuration (defaults to current working directory)
export WORKING_DIR=/Users/subhailamathy/Documents/MS/Sp25/CS532/Project/LightRAG/new_working_md_9_papers

### Settings for document indexing
export ENABLE_LLM_CACHE_FOR_EXTRACT=true
export SUMMARY_LANGUAGE=English


### LLM Configuration
### Time out in seconds for LLM, None for infinite timeout
export TIMEOUT=150
### Some models like o1-mini require temperature to be set to 1
export TEMPERATURE=0.5
### Max concurrency requests of LLM
export MAX_ASYNC=4
### Max tokens send to LLM (less than context size of the model)
export MAX_TOKENS=32768


export LLM_BINDING=openai
export LLM_MODEL=gpt-4.1-nano
export LLM_BINDING_HOST=https://api.openai.com/v1
export LLM_BINDING_API_KEY=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


export EMBEDDING_BINDING=openai
export EMBEDDING_BINDING_HOST=https://api.openai.com/v1
export EMBEDDING_MODEL=text-embedding-3-small 
export EMBEDDING_DIM=1536
export EMBEDDING_BINDING_API_KEY=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


# export LLM_BINDING=ollama
# export LLM_MODEL=tinyllama
# export LLM_BINDING_HOST=http://localhost:11434


# export EMBEDDING_BINDING=ollama
# export EMBEDDING_MODEL=mxbai-embed-large
# export EMBEDDING_BINDING_HOST=http://localhost:11434
# export EMBEDDING_DIM=786
