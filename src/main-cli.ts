#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { showDoc } from './commands/showDoc.ts';
import { startTask } from './commands/startTask.ts';
import { runTaskInWorktreeCommand } from './commands/runTaskInWorktree.ts';

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
    .option('show-doc', {
      describe: 'Display documentation from src/docs by name or substring',
      type: 'string',
      requiresArg: true,
    })
    .alias('h', 'help')
    .help()
    .strict(false)
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
