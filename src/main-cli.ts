#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { showDoc } from './commands/showDoc.ts';

async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName('flpipeline')
    .usage('$0 [options]')
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

  parser.showHelp();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
