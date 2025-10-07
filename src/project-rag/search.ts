import { DocSearchDatabase } from './database.ts';
import type { Document } from './database.ts';
import path from 'path';
import { EmbeddingService } from './embeddings.ts';

export interface SearchResult {
  document: Document;
  similarity: number;
  relevanceScore: number;
}

export class DocumentSearcher {
  private db: DocSearchDatabase;
  private embeddingService: EmbeddingService;

  constructor(db: DocSearchDatabase, embeddingService: EmbeddingService) {
    this.db = db;
    this.embeddingService = embeddingService;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const limit = options?.limit || 10;
    const minSimilarity = options?.minSimilarity ?? 0.5;
    const queryEmbedding = await this.embeddingService.generateEmbedding(
      EmbeddingService.preprocessText(query)
    );
    const similarDocuments = this.db.searchSimilarDocuments(queryEmbedding, limit * 2);
    const results: SearchResult[] = [];
    for (const result of similarDocuments) {
      const document = this.db.getDocument(result.document_id);
      if (!document) continue;
      const similarity = 1 - result.distance;
      if (similarity < minSimilarity) continue;
      const relevanceScore = this.calculateRelevanceScore(query, document, similarity);
      results.push({ document, similarity, relevanceScore });
    }
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private calculateRelevanceScore(query: string, document: Document, similarity: number): number {
    let score = similarity;

    const queryLower = query.toLowerCase();
    const titleLower = document.title.toLowerCase();
    const contentLower = document.content.toLowerCase();

    // Normalize filename: strip extension, replace separators with spaces
    const base = path.basename(document.filename, path.extname(document.filename));
    const filenameLower = base.replace(/[-_]/g, ' ').toLowerCase();

    // Direct full-string boosts
    if (titleLower.includes(queryLower)) score += 0.2;
    if (filenameLower.includes(queryLower)) score += 0.35; // heavier filename weight

    // Token-level boosting
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    let titleWordMatches = 0;
    let contentWordMatches = 0;
    let filenameWordMatches = 0;
    for (const word of queryWords) {
      if (titleLower.includes(word)) titleWordMatches++;
      if (contentLower.includes(word)) contentWordMatches++;
      if (filenameLower.includes(word)) filenameWordMatches++;
    }
    if (queryWords.length > 0) {
      score += (titleWordMatches / queryWords.length) * 0.15;
      score += (contentWordMatches / queryWords.length) * 0.08;
      score += (filenameWordMatches / queryWords.length) * 0.3; // strong filename token boost
    }

    return Math.min(score, 1.0);
  }
}

export interface SearchOptions {
  limit?: number;
  minSimilarity?: number;
  includeContent?: boolean;
}
