import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { DocSearchDatabase } from './database.ts';
import { EmbeddingService } from './embeddings.ts';
import { DocumentSearcher } from './search.ts';

interface RelevantDocsSearch {
    taskDescription: string;
    limit: number;
}

// Helper: Parse query into search terms
function parseQuery(query: string): string[] {
    return Array.from(new Set(query.toLowerCase().split(/[^a-z0-9]+/i).filter(w => w.length > 2)));
}

// Helper: Score document relevance based on lexical matching
function scoreDocument(filename: string, title: string, content: string, words: string[]): number {
    const fn = filename.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    let score = 0;
    for (const w of words) {
        if (fn.includes(w)) score += 3;
        if (titleLower.includes(w)) score += 2;
        if (contentLower.includes(w)) score += 1;
    }
    score += Math.max(0, 2 - Math.log10(Math.max(100, contentLower.length)));
    return score;
}

// Helper: simple filesystem-based lexical fallback if DB or embeddings are unavailable
async function lexicalFsFallback(search: RelevantDocsSearch): Promise<string[]> {

    const docsRoot = join(process.cwd(), 'docs');
    const files: string[] = [];

    const walk = (dir: string) => {
        let entries: string[] = [];
        try { entries = readdirSync(dir); } catch { return; }
        for (const name of entries) {
            const full = join(dir, name);
            let s; try { s = statSync(full); } catch { continue; }
            if (s.isDirectory()) walk(full);
            else if (name.toLowerCase().endsWith('.md')) files.push(full);
        }
    };
    walk(docsRoot);

    const words = parseQuery(search.taskDescription);

    const scored = files.map(fp => {
        let content = '';
        try { content = readFileSync(fp, 'utf8'); } catch {}
        const rel = relative(docsRoot, fp);
        const titleLine = content.split('\n').find(l => l.trim().startsWith('# ')) || '';
        const title = titleLine.replace(/^#\s+/, '');
        
        const score = scoreDocument(rel, title, content, words);
        return { doc: rel, score };
    });

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .filter(s => s.score > 0)
        .map(s => s.doc);
};

export async function findRelevantDocsForTask(search: RelevantDocsSearch): Promise<string[]> {
    try {
        const db = new DocSearchDatabase();
        const embeddingService = new EmbeddingService();
        const searcher = new DocumentSearcher(db, embeddingService);

        const results = await searcher.search(search.taskDescription, {
            limit: search.limit,
            minSimilarity: 0.5,
        });
        const picks = results.slice(0, 3).map(r => r.document.filename);
        
        db.close();
        return picks;
    } catch {
        // Any failure (database init, embeddings, or search) falls back to filesystem search
        return await lexicalFsFallback(search);
    }
}
