import { SqliteDatabase } from '@facetlayer/sqlite-wrapper';
import { Stream } from '@facetlayer/streams';
import Database from 'better-sqlite3';
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
  private db: SqliteDatabase;

  constructor(config?: ProjectConfig, dbPath?: string) {
    const defaultFilename = '.flpipeline.projectstate.db';
    const filename = config?.localStateDbFilename || dbPath || defaultFilename;

    const betterSqlite3Db = new Database(filename);
    this.db = new SqliteDatabase(betterSqlite3Db, Stream.newNullStream());
    this.initializeDatabase();
  }

  private initializeDatabase() {
    sqliteVec.load(this.db.db);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        title TEXT NOT NULL,
        content_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS doc_embeddings USING vec0(
        embedding FLOAT[768]
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS embedding_map (
        document_id INTEGER NOT NULL,
        embedding_rowid INTEGER NOT NULL,
        PRIMARY KEY (document_id),
        FOREIGN KEY (document_id) REFERENCES documents(id)
      );
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
    `);

    // Ensure content_hash exists for existing databases
    const columns = this.db.all(`PRAGMA table_info(documents)`) as Array<{ name: string }>;
    const hasContentHash = columns.some(c => c.name === 'content_hash');
    if (!hasContentHash) {
      this.db.run(`ALTER TABLE documents ADD COLUMN content_hash TEXT`);
    }
  }

  insertDocument(doc: Document): number {
    const existingDoc = this.getDocumentByFilename(doc.filename);

    if (existingDoc && existingDoc.id) {
      // If content hash is unchanged, skip updates and keep embeddings
      if (existingDoc.content_hash && doc.content_hash && existingDoc.content_hash === doc.content_hash) {
        return existingDoc.id;
      }
      this.db.run(
        `UPDATE documents SET content = ?, title = ?, content_hash = ? WHERE id = ?`,
        [doc.content, doc.title, doc.content_hash ?? null, existingDoc.id]
      );
      // Content changed; drop old embedding mapping to regenerate
      this.deleteEmbedding(existingDoc.id);
      return existingDoc.id;
    } else {
      const result = this.db.run(
        `INSERT INTO documents (filename, content, title, content_hash) VALUES (?, ?, ?, ?)`,
        [doc.filename, doc.content, doc.title, doc.content_hash ?? null]
      );
      return result.lastInsertRowid as number;
    }
  }

  insertEmbedding(documentId: number, embedding: Float32Array): void {
    this.deleteEmbedding(documentId);
    const result = this.db.run(
      `INSERT INTO doc_embeddings (embedding) VALUES (?)`,
      [Buffer.from(embedding.buffer)]
    );
    const embeddingRowid = result.lastInsertRowid as number;
    this.db.run(
      `INSERT OR REPLACE INTO embedding_map (document_id, embedding_rowid) VALUES (?, ?)`,
      [documentId, embeddingRowid]
    );
  }

  private deleteEmbedding(documentId: number): void {
    const mapping = this.db.get(
      'SELECT embedding_rowid FROM embedding_map WHERE document_id = ?',
      documentId
    ) as {embedding_rowid: number} | undefined;
    if (mapping) {
      this.db.run('DELETE FROM doc_embeddings WHERE rowid = ?', mapping.embedding_rowid);
      this.db.run('DELETE FROM embedding_map WHERE document_id = ?', documentId);
    }
  }

  getDocument(id: number): Document | undefined {
    return this.db.get('SELECT * FROM documents WHERE id = ?', id) as Document | undefined;
  }

  getDocumentByFilename(filename: string): Document | undefined {
    return this.db.get('SELECT * FROM documents WHERE filename = ?', filename) as Document | undefined;
  }

  searchSimilarDocuments(queryEmbedding: Float32Array, limit: number = 10): Array<{document_id: number, distance: number}> {
    return this.db.all(
      `SELECT em.document_id, vec_distance_cosine(ve.embedding, ?) as distance
       FROM doc_embeddings ve
       JOIN embedding_map em ON ve.rowid = em.embedding_rowid
       ORDER BY distance
       LIMIT ?`,
      [Buffer.from(queryEmbedding.buffer), limit]
    ) as Array<{document_id: number, distance: number}>;
  }

  getAllDocuments(): Document[] {
    return this.db.all('SELECT * FROM documents ORDER BY filename') as Document[];
  }

  deleteDocument(filename: string): void {
    const doc = this.getDocumentByFilename(filename);
    if (doc && doc.id) {
      this.deleteEmbedding(doc.id);
      this.db.run('DELETE FROM documents WHERE id = ?', doc.id);
    }
  }

  close(): void {
    this.db.close();
  }

  getStats(): {documentCount: number, embeddingCount: number} {
    const docCount = this.db.get('SELECT COUNT(*) as count FROM documents') as {count: number};
    const embeddingCount = this.db.get('SELECT COUNT(*) as count FROM embedding_map') as {count: number};
    return { documentCount: docCount.count, embeddingCount: embeddingCount.count };
  }
}