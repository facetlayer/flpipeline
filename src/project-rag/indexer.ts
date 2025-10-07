import { glob } from 'glob';
import { readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DocSearchDatabase } from './database.ts';
import type { Document } from './database.ts';
import { EmbeddingService } from './embeddings.ts';

export class DocumentIndexer {
  private db: DocSearchDatabase;
  private embeddingService: EmbeddingService;

  constructor(db: DocSearchDatabase, embeddingService: EmbeddingService) {
    this.db = db;
    this.embeddingService = embeddingService;
  }

  async indexDocuments(docsPath: string): Promise<void> {
    const markdownFiles = await glob('**/*.md', { cwd: docsPath, absolute: false });
    for (const file of markdownFiles) {
      await this.indexDocument(path.join(docsPath, file), file);
    }
  }

  async indexDocument(filePath: string, relativePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // Check if unchanged
    const existing = this.db.getDocumentByFilename(relativePath);
    if (existing && existing.content_hash === contentHash) {
      return; // Skip unchanged file
    }

    console.log('updating embedding for: ', relativePath);
    const title = this.extractTitle(content, relativePath);
    const processedContent = EmbeddingService.preprocessText(content);
    const doc: Document = { filename: relativePath, content: processedContent, title, content_hash: contentHash };
    const documentId = this.db.insertDocument(doc);
    const chunks = EmbeddingService.chunkText(processedContent);
    const filenameForSearch = path.basename(relativePath, '.md').replace(/[-_]/g, ' ');
    if (chunks.length <= 1) {
      const contentWithFilename = `${filenameForSearch}\n${title}\n\n${chunks[0] ?? processedContent}`;
      const embedding = await this.embeddingService.generateEmbedding(contentWithFilename);
      this.db.insertEmbedding(documentId, embedding);
    } else {
      const contentWithFilename = `${filenameForSearch}\n${title}\n\n${processedContent.slice(0, 2000)}`;
      const fullDocEmbedding = await this.embeddingService.generateEmbedding(contentWithFilename);
      this.db.insertEmbedding(documentId, fullDocEmbedding);
    }
  }

  private extractTitle(content: string, filename: string): string {
    const lines = content.split('\n');
    const baseName = path.basename(filename, '.md');
    const fileTitle = baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    for (const line of lines.slice(0, 10)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        const heading = trimmed.substring(2).trim();
        if (heading.split(' ').length === 1 || ['logging','overview','introduction','summary'].includes(heading.toLowerCase())) {
          return fileTitle;
        }
        return heading;
      }
    }
    return fileTitle;
  }
}
