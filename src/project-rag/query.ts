#!/usr/bin/env tsx

import path from 'path';
import { DocSearchDatabase } from './database.js';
import { EmbeddingService } from './embeddings.js';
import { DocumentSearcher } from './search.js';

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.log('Usage: tsx tools/doc-rag/src/query.ts "your search query"');
    process.exit(1);
  }
  const dbPath = path.resolve(__dirname, '../docs.db');
  const db = new DocSearchDatabase(dbPath);
  const embeddingService = new EmbeddingService();
  const searcher = new DocumentSearcher(db, embeddingService);
  const results = await searcher.search(query, { limit: 5, minSimilarity: 0.5 });
  console.log(JSON.stringify(results.map(r => ({
    filename: r.document.filename,
    title: r.document.title,
    similarity: r.similarity,
    relevance: r.relevanceScore
  })), null, 2));
  db.close();
}

main().catch(err => {
  console.error('Error during search:', err);
  process.exit(1);
});

