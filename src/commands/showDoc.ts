import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT_DIR } from '../dirs';

const DOCS_DIR = path.resolve(PROJECT_ROOT_DIR, 'src/docs');

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        // Store relative path from DOCS_DIR
        const relativePath = path.relative(DOCS_DIR, fullPath);
        files.push(relativePath);
      }
    }
  }

  await traverse(dir);
  return files;
}

export async function showDoc(input: string): Promise<void> {
  const query = input?.trim();

  if (!query) {
    throw new Error('Expected a document name for --show-doc.');
  }

  let files: string[];
  try {
    files = await getAllFiles(DOCS_DIR);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read docs directory at ${DOCS_DIR}: ${message}`);
  }

  const normalizedQuery = query.toLowerCase();
  const matches = files.filter((file) => file.toLowerCase().includes(normalizedQuery));

  if (matches.length === 0) {
    throw new Error(`No document found matching "${query}".`);
  }

  const exactMatch = matches.find((file) => {
    const lower = file.toLowerCase();
    const baseWithoutExt = lower.replace(/\.[^/.]+$/, '');
    return lower === normalizedQuery || baseWithoutExt === normalizedQuery;
  });

  const selectedFile = exactMatch ?? (matches.length === 1 ? matches[0] : null);

  if (!selectedFile) {
    throw new Error(`Multiple documents match "${query}": ${matches.join(', ')}.`);
  }

  const docPath = path.join(DOCS_DIR, selectedFile);

  let contents: string;
  try {
    contents = await fs.readFile(docPath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read document "${selectedFile}": ${message}`);
  }

  if (contents.length === 0) {
    return;
  }

  process.stdout.write(contents);
  if (!contents.endsWith('\n')) {
    process.stdout.write('\n');
  }
}
