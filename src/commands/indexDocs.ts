import path from 'path';
import { existsSync } from 'fs';
import { DocSearchDatabase } from '../project-rag/database.js';
import { EmbeddingService } from '../project-rag/embeddings.js';
import { DocumentIndexer } from '../project-rag/indexer.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { PROJECT_ROOT_DIR } from '../dirs.js';

export interface IndexDocsArgs {
  docsPath?: string;
}

export async function indexDocs(args: IndexDocsArgs = {}): Promise<void> {
  // Get the database path from config
  const config = getLocalConfigs(PROJECT_ROOT_DIR);
  const dbPath = path.join(PROJECT_ROOT_DIR, config.docsDbFilename!);

  // Determine docs path - default to specs directory
  let docsPath = args.docsPath || path.join(PROJECT_ROOT_DIR, 'specs');

  if (!existsSync(docsPath)) {
    // Try docs directory as fallback
    const altPath = path.join(PROJECT_ROOT_DIR, 'docs');
    if (existsSync(altPath)) {
      docsPath = altPath;
    } else {
      throw new Error(`Documentation directory not found: ${docsPath}`);
    }
  }

  console.log(`Indexing documentation from: ${docsPath}`);
  console.log(`Using database: ${dbPath}`);

  const db = new DocSearchDatabase(dbPath);
  const embeddingService = new EmbeddingService();
  const indexer = new DocumentIndexer(db, embeddingService);

  try {
    await indexer.indexDocuments(docsPath);
    const stats = db.getStats();
    console.log('\nIndexing complete!');
    console.log(`Total documents: ${stats.documentCount}`);
    console.log(`Total embeddings: ${stats.embeddingCount}`);
  } finally {
    db.close();
  }
}
