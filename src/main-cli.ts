#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { showDoc } from './commands/showDoc.ts';
import { startTask } from './commands/startTask.ts';
import { runTaskInWorktreeCommand } from './commands/runTaskInWorktree.ts';
import { closeWorktree } from './commands/closeWorktree.ts';
import { searchHints } from './commands/searchHints.ts';
import { listHints } from './commands/listHints.ts';
import { showHints } from './commands/showHints.ts';

async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName('flpipeline')
    .usage('$0 [options]')
    .command('start <taskNamesOrFiles..>', 'Create new worktrees from task markdown files', (yargs) => {
      return yargs.positional('taskFiles', {
        describe: 'Branch name or paths to markdown task definition file(s)',
        type: 'string',
        array: true,
        demandOption: true
      })
      .option('branch-name', {
        describe: 'Override the branch name from the markdown file (only works with single file)',
        type: 'string'
      })
      .option('from-branch', {
        describe: 'Base branch to create worktree from (defaults to origin/main)',
        type: 'string'
      });
    }, async (argv) => {
      await startTask({
        taskFiles: argv.taskNamesOrFiles as string[],
        branchName: argv['branch-name'] as string | undefined,
        fromBranch: argv['from-branch'] as string | undefined
      });
    })
    .command('run-task-in-worktree', 'Run task in current worktree with Claude', () => {}, async () => {
      await runTaskInWorktreeCommand();
    })
    .command('close-worktree', 'Close any processes for this worktree', () => {}, async () => {
      await closeWorktree();
    })
    .command('search-hints <query>', 'Search for relevant hint files using LLM', (yargs) => {
      return yargs.positional('query', {
        describe: 'Search query for hints',
        type: 'string',
        demandOption: true
      })
      .option('limit', {
        alias: 'l',
        describe: 'Maximum number of hints to return',
        type: 'number',
        default: 5
      })
      .option('model', {
        alias: 'm',
        describe: 'LLM model to use (e.g., llama2, llama3)',
        type: 'string'
      })
      .option('temperature', {
        alias: 't',
        describe: 'Temperature for LLM generation (0.0-1.0)',
        type: 'number',
        default: 0.3
      });
    }, async (argv) => {
      await searchHints({
        query: argv.query as string,
        limit: argv.limit as number,
        model: argv.model as string | undefined,
        temperature: argv.temperature as number
      });
    })
    .command('list-all-hints', 'List all available hint files', (yargs) => {
      return yargs.option('verbose', {
        alias: 'v',
        describe: 'Show descriptions and relevance criteria',
        type: 'boolean',
        default: false
      });
    }, async (argv) => {
      await listHints({
        verbose: argv.verbose as boolean
      });
    })
    .command('show-hints <query>', 'Display full content of hint files matching search query', (yargs) => {
      return yargs.positional('query', {
        describe: 'Search query for hints',
        type: 'string',
        demandOption: true
      })
      .option('limit', {
        alias: 'l',
        describe: 'Maximum number of hints to return',
        type: 'number',
        default: 5
      })
      .option('model', {
        alias: 'm',
        describe: 'LLM model to use (e.g., llama2, llama3)',
        type: 'string'
      })
      .option('temperature', {
        alias: 't',
        describe: 'Temperature for LLM generation (0.0-1.0)',
        type: 'number',
        default: 0.3
      });
    }, async (argv) => {
      await showHints({
        query: argv.query as string,
        limit: argv.limit as number,
        model: argv.model as string | undefined,
        temperature: argv.temperature as number
      });
    })
    .option('show-doc', {
      describe: 'Display documentation from src/docs by name or substring',
      type: 'string',
      requiresArg: true,
    })
    .alias('h', 'help')
    .help()
    .strict(true)
    .fail((msg, err) => {
      const error = err ?? new Error(msg);
      console.error(error.message);
      process.exit(1);
    });

  const argv = await parser.parseAsync();
  const docName = argv['show-doc'];

  if (typeof docName === 'string' && docName.length > 0) {
    await showDoc(docName);
    return;
  }

  if (argv._.length === 0 && !docName) {
    parser.showHelp();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
