import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(currentDir, '../docs');

export async function showDoc(input: string): Promise<void> {
  const query = input?.trim();

  if (!query) {
    throw new Error('Expected a document name for --show-doc.');
  }

  let files: string[];
  try {
    files = await fs.readdir(docsDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read docs directory at ${docsDir}: ${message}`);
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

  const docPath = path.join(docsDir, selectedFile);

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
