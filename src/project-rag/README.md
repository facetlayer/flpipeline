# Documentation RAG

A small RAG (Retrieval-Augmented Generation) utility for searching local project docs in `./docs` using SQLite + vector embeddings.

Features
- Semantic search via embeddings (Ollama `nomic-embed-text`)
- SQLite + sqlite-vec for efficient cosine similarity
- Lightweight lexical fallbacks when embeddings are unavailable
- Importable classes for indexing/search and simple CLI usage

Files
- `src/database.ts`: SQLite schema and helpers
- `src/embeddings.ts`: Embedding generation via Ollama
- `src/indexer.ts`: Index/build embeddings for docs
- `src/search.ts`: Search and relevance scoring
- `src/query.ts`: Minimal example CLI
- `src/cli.ts`: Rich CLI for indexing/searching

Requirements
- Node.js 18+
- `sqlite-vec` native extension (installed via npm dependency)
- Optional: Ollama running locally if you want semantic search

