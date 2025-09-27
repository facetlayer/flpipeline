#!/usr/bin/env node

import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { DocSearchDatabase } from './database.js';
import { EmbeddingService } from './embeddings.js';
import { DocumentIndexer } from './indexer.js';
import { DocumentSearcher } from './search.js';

yargs(hideBin(process.argv))
  .scriptName('doc-rag')
  .version('1.0.0')
  .usage('RAG-powered documentation search')
  .command(
    'index',
    'Index all documentation files',
    (yargs: Argv) => {
      return yargs
        .option('path', {
          alias: 'p',
          type: 'string',
          description: 'Path to docs directory',
          default: '../../docs'
        })
        .option('database', {
          alias: 'd',
          type: 'string',
          description: 'Database file path'
        });
    },
    async (argv: any) => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirnameESM = path.dirname(__filename);
      let docsPath = path.resolve(__dirnameESM, argv.path);
      if (!existsSync(docsPath)) {
        const alt = path.resolve(__dirnameESM, '../../../docs');
        if (existsSync(alt)) {
          docsPath = alt;
        }
      }
      const db = new DocSearchDatabase(argv.database);
      const embeddingService = new EmbeddingService();
      const indexer = new DocumentIndexer(db, embeddingService);
      await indexer.indexDocuments(docsPath);
      const stats = db.getStats();
      console.log('Finished checking every doc.');
      console.log(' - Total stored documents: ' + stats.documentCount);
      db.close();
    }
  )
  .command(
    'search <query>',
    'Search for relevant documentation',
    (yargs: Argv) => {
      return yargs
        .positional('query', {
          type: 'string',
          description: 'Search query',
          demandOption: true
        })
        .option('limit', {
          alias: 'l',
          type: 'number',
          description: 'Maximum number of results',
          default: 5
        })
        .option('similarity', {
          alias: 's',
          type: 'number',
          description: 'Minimum similarity threshold',
          default: 0.6
        })
        .option('database', {
          alias: 'd',
          type: 'string',
          description: 'Database file path'
        });
    },
    async (argv: any) => {
      const db = new DocSearchDatabase(argv.database);
      const embeddingService = new EmbeddingService();
      const searcher = new DocumentSearcher(db, embeddingService);
      const results = await searcher.search(argv.query, {
        limit: argv.limit,
        minSimilarity: argv.similarity
      });
      console.log(JSON.stringify(results.map(r => ({
        filename: r.document.filename,
        title: r.document.title,
        similarity: r.similarity,
        relevance: r.relevanceScore
      })), null, 2));
      db.close();
    }
  )
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .parseAsync();
