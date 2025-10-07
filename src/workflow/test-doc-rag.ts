#!/usr/bin/env tsx

import { annotateInstructions } from './runTaskInWorktree.js';

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('Usage: tsx tools/workflow/test-doc-rag.ts "your task description"');
    process.exit(1);
  }

  const augmented = await annotateInstructions(query);
  console.log('\n--- Augmented Prompt ---\n');
  console.log(augmented);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

