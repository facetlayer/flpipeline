import { SqliteWrapper } from '@facetlayer/sqlite-wrapper';
import * as sqliteVec from 'sqlite-vec';
import path from 'path';
import { ProjectConfig } from '../config/ProjectConfig.js';

export interface Document {
  id?: number;
  filename: string;
  content: string;
  title: string;
  content_hash?: string;
  created_at?: string;
}

export interface DocumentEmbedding {
  rowid: number;
  embedding: Float32Array;
}

export class DocSearchDatabase {
  private db: SqliteWrapper;

  constructor(config?: ProjectConfig, dbPath?: string) {
    const defaultFilename = '.flpipeline.projectstate.db';
    const filename = config?.localStateDbFilename || dbPath || defaultFilename;

    this.db = new SqliteWrapper(filename);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    sqliteVec.load(this.db.db);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        title TEXT NOT NULL,
        content_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS doc_embeddings USING vec0(
        embedding FLOAT[768]
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embedding_map (
        document_id INTEGER NOT NULL,
        embedding_rowid INTEGER NOT NULL,
        PRIMARY KEY (document_id),
        FOREIGN KEY (document_id) REFERENCES documents(id)
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
    `);

    // Ensure content_hash exists for existing databases
    const columns = this.db.prepare(`PRAGMA table_info(documents)`).all() as Array<{ name: string }>;
    const hasContentHash = columns.some(c => c.name === 'content_hash');
    if (!hasContentHash) {
      this.db.exec(`ALTER TABLE documents ADD COLUMN content_hash TEXT`);
    }
  }

  insertDocument(doc: Document): number {
    const existingDoc = this.getDocumentByFilename(doc.filename);

    if (existingDoc && existingDoc.id) {
      // If content hash is unchanged, skip updates and keep embeddings
      if (existingDoc.content_hash && doc.content_hash && existingDoc.content_hash === doc.content_hash) {
        return existingDoc.id;
      }
      const updateStmt = this.db.prepare(`
        UPDATE documents SET content = ?, title = ?, content_hash = ? WHERE id = ?
      `);
      updateStmt.run(doc.content, doc.title, doc.content_hash ?? null, existingDoc.id);
      // Content changed; drop old embedding mapping to regenerate
      this.deleteEmbedding(existingDoc.id);
      return existingDoc.id;
    } else {
      const insertStmt = this.db.prepare(`
        INSERT INTO documents (filename, content, title, content_hash)
        VALUES (?, ?, ?, ?)
      `);
      const result = insertStmt.run(doc.filename, doc.content, doc.title, doc.content_hash ?? null);
      return result.lastInsertRowid as number;
    }
  }

  insertEmbedding(documentId: number, embedding: Float32Array): void {
    this.deleteEmbedding(documentId);
    const stmt = this.db.prepare(`
      INSERT INTO doc_embeddings (embedding) VALUES (?)
    `);
    const result = stmt.run(Buffer.from(embedding.buffer));
    const embeddingRowid = result.lastInsertRowid as number;
    const mapStmt = this.db.prepare(`
      INSERT OR REPLACE INTO embedding_map (document_id, embedding_rowid) VALUES (?, ?)
    `);
    mapStmt.run(documentId, embeddingRowid);
  }

  private deleteEmbedding(documentId: number): void {
    const mapQuery = this.db.prepare('SELECT embedding_rowid FROM embedding_map WHERE document_id = ?');
    const mapping = mapQuery.get(documentId) as {embedding_rowid: number} | undefined;
    if (mapping) {
      const deleteEmbeddingStmt = this.db.prepare('DELETE FROM doc_embeddings WHERE rowid = ?');
      deleteEmbeddingStmt.run(mapping.embedding_rowid);
      const deleteMapStmt = this.db.prepare('DELETE FROM embedding_map WHERE document_id = ?');
      deleteMapStmt.run(documentId);
    }
  }

  getDocument(id: number): Document | undefined {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?');
    return stmt.get(id) as Document | undefined;
  }

  getDocumentByFilename(filename: string): Document | undefined {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE filename = ?');
    return stmt.get(filename) as Document | undefined;
  }

  searchSimilarDocuments(queryEmbedding: Float32Array, limit: number = 10): Array<{document_id: number, distance: number}> {
    const stmt = this.db.prepare(`
      SELECT em.document_id, vec_distance_cosine(ve.embedding, ?) as distance
      FROM doc_embeddings ve
      JOIN embedding_map em ON ve.rowid = em.embedding_rowid
      ORDER BY distance
      LIMIT ?
    `);
    return stmt.all(Buffer.from(queryEmbedding.buffer), limit) as Array<{document_id: number, distance: number}>;
  }

  getAllDocuments(): Document[] {
    const stmt = this.db.prepare('SELECT * FROM documents ORDER BY filename');
    return stmt.all() as Document[];
  }

  deleteDocument(filename: string): void {
    const doc = this.getDocumentByFilename(filename);
    if (doc && doc.id) {
      this.deleteEmbedding(doc.id);
      const deleteDoc = this.db.prepare('DELETE FROM documents WHERE id = ?');
      deleteDoc.run(doc.id);
    }
  }

  close(): void {
    this.db.close();
  }

  getStats(): {documentCount: number, embeddingCount: number} {
    const docCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get() as {count: number};
    const embeddingCount = this.db.prepare('SELECT COUNT(*) as count FROM embedding_map').get() as {count: number};
    return { documentCount: docCount.count, embeddingCount: embeddingCount.count };
  }
}