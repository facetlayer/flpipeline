import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export function promptUserToWriteFile(branchName: string): string {
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
