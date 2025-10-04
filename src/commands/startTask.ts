import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createWorktree, } from '../worktree/create-worktree.ts';
import { parseFrontmatter } from '../utils/parseFrontmatter.ts';
import { promptUserToWriteFile } from '../workflow/promptUserToWriteFile.ts';
import { openITermWindow } from '../workflow/openItermWindow.ts';
import * as Path from 'path';

export interface StartTaskArgs {
    taskFiles: string[];
    branchName?: string;
    fromBranch?: string;
}

function readTaskFile(taskFile: string): { branchName?: string, content: string } {
    if (!existsSync(taskFile)) {
        // Treat the argument as a branch name and open editor
        console.log(`📝 File '${taskFile}' not found. Treating as branch name and opening editor...`);
        const content = promptUserToWriteFile(taskFile);
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

function writeTaskInstructions(worktreePath: string, taskContent: string): void {
    const instructionsPath = Path.join(worktreePath, '.current_task_instructions');
    writeFileSync(instructionsPath, taskContent, 'utf8');
}

export async function startTask(args: StartTaskArgs): Promise<void> {
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

            const initialCommand = `cd '${worktreePath}' && pnpm install && tools/workflow/run-task-in-worktree.ts`;
            openITermWindow({ initialCommand, windowName: branchName });

            console.log(`✅ Worktree '${branchName}' created successfully at ${worktreePath}`);
        }

        console.log(`\n🎉 Successfully created ${args.taskFiles.length} worktree${args.taskFiles.length === 1 ? '' : 's'}`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
