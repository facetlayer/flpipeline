# Adding a Command

## Intention

Define the standard process for adding new CLI commands to the flpipeline tool. This ensures consistency in command implementation and makes it easy for developers to extend the CLI with new functionality.

## Functional Requirements

### Command File Structure
- Each command should be implemented in its own file under `./src/commands/`
- Command files should be named using camelCase (e.g., `showDoc.ts`, `startTask.ts`, `runTaskInWorktree.ts`)
- Each command file should export a function that implements the command's logic
- The exported function name should match the file name in camelCase

### Command Implementation Patterns

There are two common patterns for command implementation:

#### Pattern 1: Option Handler (e.g., `showDoc`)
Used for commands implemented as CLI options rather than subcommands:
- Export a single function that accepts the option value as a parameter
- Function signature: `export async function commandName(input: string): Promise<void>`
- Called manually in the `main()` function based on parsed arguments

#### Pattern 2: Subcommand Handler (e.g., `startTask`, `runTaskInWorktree`)
Used for commands implemented as yargs subcommands:
- Export a function that accepts an arguments object with typed parameters
- Function signature: `export async function commandName(args: CommandArgs): Promise<void>`
- Define an interface for the command's arguments (e.g., `StartTaskArgs`)
- Called via yargs command handler

### Registering Commands in main-cli.ts

Commands must be registered in `./src/main-cli.ts`:

1. **Import the command function** at the top of the file:
   ```typescript
   import { commandName } from './commands/commandName.ts';
   ```

2. **For option-based commands** (like `showDoc`):
   - Add an option definition using `.option()` in the yargs chain
   - Handle the option value in the `main()` function after `parseAsync()`
   - Example:
     ```typescript
     .option('show-doc', {
       describe: 'Display documentation from src/docs by name or substring',
       type: 'string',
       requiresArg: true,
     })

     // Later in main():
     const docName = argv['show-doc'];
     if (typeof docName === 'string' && docName.length > 0) {
       await showDoc(docName);
       return;
     }
     ```

3. **For subcommand-based commands** (like `start` or `run-task-in-worktree`):
   - Add a command definition using `.command()` in the yargs chain
   - Define command syntax with positional arguments and options
   - Provide a builder function to configure arguments
   - Provide an async handler function that calls the command implementation
   - Example:
     ```typescript
     .command('start <taskNamesOrFiles..>', 'Create new worktrees from task markdown files', (yargs) => {
       return yargs.positional('taskFiles', {
         describe: 'Branch name or paths to markdown task definition file(s)',
         type: 'string',
         array: true,
         demandOption: true
       })
       .option('branch-name', {
         describe: 'Override the branch name from the markdown file',
         type: 'string'
       });
     }, async (argv) => {
       await startTask({
         taskFiles: argv.taskNamesOrFiles as string[],
         branchName: argv['branch-name'] as string | undefined
       });
     })
     ```

### Naming Conventions

- **File names**: Use camelCase with `.ts` extension (e.g., `showDoc.ts`, `runTaskInWorktree.ts`)
- **Exported function names**: Match the file name in camelCase (e.g., `export async function showDoc()`)
- **Argument interfaces**: Use PascalCase with `Args` suffix (e.g., `StartTaskArgs`, `ShowDocArgs`)
- **Command names in CLI**: Use kebab-case for multi-word commands (e.g., `run-task-in-worktree`)
- **Option names**: Use kebab-case (e.g., `--branch-name`, `--show-doc`)

### Error Handling

- Commands should throw errors for invalid input or failure conditions
- Error messages should be descriptive and user-friendly
- The main CLI error handler in `main-cli.ts` will catch and display errors
- Use `process.exit(1)` for error conditions (handled by the fail handler)

## Related Source Files

- `src/main-cli.ts` - Main CLI entry point where commands are registered
- `src/commands/showDoc.ts` - Example of option-based command
- `src/commands/startTask.ts` - Example of subcommand with complex arguments
- `src/commands/runTaskInWorktree.ts` - Example of simple subcommand

## Implementation Steps

To add a new command:

1. Create a new file in `./src/commands/` with a descriptive camelCase name
2. Implement the command logic in an exported async function
3. Define any necessary argument interfaces
4. Import the command function in `./src/main-cli.ts`
5. Register the command using either `.option()` or `.command()` depending on the pattern
6. Test the command by running `flpipeline <command-name>` or `flpipeline --option-name`

## Edge Cases

- **No arguments provided**: The CLI should display help text when no command is specified (handled in main-cli.ts:59-61)
- **Invalid arguments**: Yargs handles validation and displays helpful error messages
- **Command conflicts**: Avoid creating options and subcommands with the same name
- **Async operations**: All command functions should be async and properly await any async operations
