#!/usr/bin/env tsx

import { DocSearchDatabase } from './project-rag/database.js';
import { EmbeddingService } from './project-rag/embeddings.js';
import { DocumentSearcher } from './project-rag/search.js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

interface SearchResult {
  filename: string;
}

async function readStdin(): Promise<string> {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

function getQueryFromArgs(): string {
  let query = process.argv.slice(2).join(' ').trim();
  return query;
}

function parseQuery(query: string): string[] {
  return Array.from(new Set(query.toLowerCase().split(/[^a-z0-9]+/i).filter(w => w.length > 2)));
}

function calculateScore(words: string[], filename: string, title: string, content: string): number {
  const fn = filename.toLowerCase();
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  
  let score = 0;
  for (const word of words) {
    if (fn.includes(word)) score += 3;
    if (titleLower.includes(word)) score += 2;
    if (contentLower.includes(word)) score += 1;
  }
  
  // Boost shorter documents slightly
  score += Math.max(0, 2 - Math.log10(Math.max(100, contentLower.length)));
  return score;
}

function walkDocsDirectory(): string[] {
  const docsRoot = join(process.cwd(), 'docs');
  const files: string[] = [];
  
  const walk = (dir: string) => {
    let entries: string[] = [];
    try { 
      entries = readdirSync(dir); 
    } catch { 
      return; 
    }
    
    for (const name of entries) {
      const fullPath = join(dir, name);
      let stats;
      try { 
        stats = statSync(fullPath); 
      } catch { 
        continue; 
      }
      
      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (name.toLowerCase().endsWith('.md')) {
        files.push(fullPath);
      }
    }
  };
  
  walk(docsRoot);
  return files;
}

function extractTitle(content: string): string {
  const titleLine = content.split('\n').find(l => l.trim().startsWith('# ')) || '';
  return titleLine.replace(/^#\s+/, '');
}

async function searchWithEmbeddings(query: string): Promise<SearchResult[]> {
  const db = new DocSearchDatabase('.flpipeline.docsearch.db');
  try {
    const embeddingService = new EmbeddingService();
    const searcher = new DocumentSearcher(db, embeddingService);
    const results = await searcher.search(query, { limit: 5, minSimilarity: 0.5 });
    return results.map(r => ({ filename: `./docs/${r.document.filename}` }));
  } finally {
    db.close();
  }
}

async function searchWithDatabase(query: string): Promise<SearchResult[]> {
  const db = new DocSearchDatabase('.flpipeline.docsearch.db');
  try {
    const documents = db.getAllDocuments();
    const words = parseQuery(query);
    
    const scored = documents.map(doc => {
      const score = calculateScore(
        words,
        doc.filename,
        doc.title || '',
        doc.content || ''
      );
      return { filename: `./docs/${doc.filename}`, score };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .filter(x => x.score > 0)
      .map(x => ({ filename: x.filename }));
  } finally {
    db.close();
  }
}

async function searchWithFilesystem(query: string): Promise<SearchResult[]> {
  const docsRoot = join(process.cwd(), 'docs');
  const files = walkDocsDirectory();
  const words = parseQuery(query);
  
  const scored = files.map(filePath => {
    let content = '';
    try { 
      content = readFileSync(filePath, 'utf8'); 
    } catch {
      // Skip files that can't be read
    }
    
    const relativePath = relative(docsRoot, filePath);
    const title = extractTitle(content);
    const score = calculateScore(words, relativePath, title, content);
    
    return { filename: `./docs/${relativePath}`, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .filter(s => s.score > 0)
    .map(s => ({ filename: s.filename }));
}

async function performSearch(query: string): Promise<SearchResult[]> {
  // Try embedding search first
  try {
    return await searchWithEmbeddings(query);
  } catch {
    // Fall back to database search
    try {
      return await searchWithDatabase(query);
    } catch {
      // Final fallback to filesystem search
      return await searchWithFilesystem(query);
    }
  }
}

function printResults(results: SearchResult[]): void {
  if (results.length === 0) {
    console.log('No matching files found.');
    return;
  }
  
  console.log(`Found ${results.length} matching file${results.length === 1 ? '' : 's'}:`);
  for (const result of results) {
    console.log(` - ${result.filename}`);
  }
}

async function main(): Promise<void> {
  let query = getQueryFromArgs();
  
  if (!query) {
    const stdin = await readStdin();
    query = stdin.trim();
  }
  
  if (!query) {
    console.error('Usage: tsx tools/search-docs.ts "your text" OR echo "text" | tsx tools/search-docs.ts');
    process.exit(1);
  }
  
  const results = await performSearch(query);
  printResults(results);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

