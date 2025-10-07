import path from 'path';
import { DocSearchDatabase } from '../project-rag/database.js';
import { EmbeddingService } from '../project-rag/embeddings.js';
import { DocumentSearcher } from '../project-rag/search.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { PROJECT_ROOT_DIR } from '../dirs.js';

export interface SearchDocsArgs {
  query: string;
  limit?: number;
  similarity?: number;
}

export async function searchDocs(args: SearchDocsArgs): Promise<void> {
  const { query, limit = 5, similarity = 0.6 } = args;

  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  // Get the database path from config
  const config = getLocalConfigs(PROJECT_ROOT_DIR);
  const dbPath = path.join(PROJECT_ROOT_DIR, config.docsDbFilename!);

  const db = new DocSearchDatabase(dbPath);
  const embeddingService = new EmbeddingService();
  const searcher = new DocumentSearcher(db, embeddingService);

  try {
    const results = await searcher.search(query, {
      limit,
      minSimilarity: similarity
    });

    if (results.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(JSON.stringify(results.map(r => ({
      filename: r.document.filename,
      title: r.document.title,
      similarity: r.similarity.toFixed(3),
      relevance: r.relevanceScore.toFixed(3)
    })), null, 2));
  } finally {
    db.close();
  }
}
