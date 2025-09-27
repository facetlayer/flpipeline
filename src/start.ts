#!/usr/bin/env node

import yargs from 'yargs';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createWorktree, } from './worktree/create-worktree.ts';

interface Arguments {
    taskFiles: string[];
    branchName?: string;
    fromBranch?: string;
}

async function parseArguments(): Promise<Arguments> {
    const argv = await yargs(process.argv.slice(2))
        .command('$0 <taskFiles..>', 'Create new worktrees from task markdown files', (yargs) => {
            return yargs.positional('taskFiles', {
                describe: 'Paths to the markdown task definition files',
                type: 'string',
                array: true,
                demandOption: true
            });
        })
        .option('branch-name', {
            describe: 'Override the branch name from the markdown file (only works with single file)',
            type: 'string'
        })
        .option('from-branch', {
            describe: 'Base branch to create worktree from (defaults to origin/main)',
            type: 'string'
        })
        .help()
        .argv;

    return {
        taskFiles: argv.taskFiles as string[],
        branchName: argv['branch-name'] as string | undefined,
        fromBranch: argv['from-branch'] as string | undefined
    };
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>, body: string } {
    const lines = content.split('\n');
    const frontmatter: Record<string, string> = {};
    let inFrontmatter = false;
    let bodyStartIndex = 0;

    if (lines[0] === '---') {
        inFrontmatter = true;
        let i = 1;
        while (i < lines.length) {
            if (lines[i] === '---') {
                bodyStartIndex = i + 1;
                break;
            }
            const match = lines[i].match(/^([^:]+):\s*(.*)$/);
            if (match) {
                frontmatter[match[1].trim()] = match[2].trim();
            }
            i++;
        }
    }

    const body = lines.slice(bodyStartIndex).join('\n');
    return { frontmatter, body };
}

function openEditorForContent(branchName: string): string {
    const tempFile = join(tmpdir(), `task-${Date.now()}.md`);
    const initialContent = `---
branch-name: ${branchName}
---

# Task: ${branchName}

Describe your task here...
`;
    
    writeFileSync(tempFile, initialContent, 'utf8');
    
    const editor = process.env.EDITOR || process.env.VISUAL || 'vim';
    console.log(`📝 Opening ${editor} to create task content...`);
    console.log(`💡 Tip: Edit the task description, save and close the editor to continue`);
    
    try {
        execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
        const content = readFileSync(tempFile, 'utf8');
        
        // Check if the user actually wrote something meaningful
        if (content.trim() === initialContent.trim()) {
            unlinkSync(tempFile);
            throw new Error('Task content was not modified. Please provide a task description.');
        }
        
        unlinkSync(tempFile);
        return content;
    } catch (error) {
        // Clean up temp file even if there's an error
        if (existsSync(tempFile)) {
            unlinkSync(tempFile);
        }
        throw new Error(`Failed to open editor: ${error}`);
    }
}

function readTaskFile(taskFile: string): { branchName?: string, content: string } {
    if (!existsSync(taskFile)) {
        // Treat the argument as a branch name and open editor
        console.log(`📝 File '${taskFile}' not found. Treating as branch name and opening editor...`);
        const content = openEditorForContent(taskFile);
        const { frontmatter, body } = parseFrontmatter(content);
        
        return {
            branchName: frontmatter['branch-name'] || taskFile,
            content: body
        };
    }

    const content = readFileSync(taskFile, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    return {
        branchName: frontmatter['branch-name'],
        content: body
    };
}

function generateDatePrefix(): string {
    const today = new Date();
    return today.getFullYear().toString() + 
           (today.getMonth() + 1).toString().padStart(2, '0') + 
           today.getDate().toString().padStart(2, '0');
}

function validateCurrentBranch(): void {
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
        throw new Error(`Must be on 'main' branch. Currently on '${currentBranch}'`);
    }
}

function openITermWindow(branchName: string, worktreePath: string): void {
    console.log('Opening iTerm in new worktree directory...');
    
    // Command to run in the new iTerm window
    const command = `cd '${worktreePath}' && pnpm install && tools/workflow/run-task-in-worktree.ts`;
    
    // Use osascript directly
    const escapedCommands = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "'");
    const escapedBranchName = branchName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    const osaScript = `
        tell application "iTerm"
            create window with default profile
            tell current session of current window
                set name to "${escapedBranchName}"
                write text "${escapedCommands}"
            end tell
        end tell
    `;
    execSync(`osascript -e '${osaScript}'`);
}

function writeTaskInstructions(worktreePath: string, taskContent: string): void {
    const instructionsPath = join(worktreePath, '.current_task_instructions');
    writeFileSync(instructionsPath, taskContent, 'utf8');
}

export async function main() {
    const args = await parseArguments();
    
    try {
        // Validate we're on main branch before processing any files
        validateCurrentBranch();

        // If branch name override is provided but multiple files are given, warn the user
        if (args.branchName && args.taskFiles.length > 1) {
            console.warn('⚠️  Warning: --branch-name option ignored when processing multiple files');
        }

        // Process each task file
        for (const taskFile of args.taskFiles) {
            console.log(`\n📝 Processing ${taskFile}...`);
            
            // Read the task file
            const task = readTaskFile(taskFile);
            
            // Determine branch name (CLI override > frontmatter > filename)
            // Only use CLI override if processing a single file
            let baseBranchName = (args.taskFiles.length === 1 ? args.branchName : undefined) || task.branchName;
            if (!baseBranchName) {
                // Use filename without .md extension as fallback
                const filename = taskFile.split('/').pop() || taskFile;
                baseBranchName = filename.replace(/\.md$/i, '');
            }
            
            // Add date prefix
            const datePrefix = generateDatePrefix();
            const branchName = `${datePrefix}-${baseBranchName}`;
            
            const worktreePath = createWorktree(branchName, args.fromBranch);
            // setupNodeModules(worktreePath);
            writeTaskInstructions(worktreePath, task.content);
            openITermWindow(branchName, worktreePath);

            console.log(`✅ Worktree '${branchName}' created successfully at ${worktreePath}`);
        }

        console.log(`\n🎉 Successfully created ${args.taskFiles.length} worktree${args.taskFiles.length === 1 ? '' : 's'}`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
}
