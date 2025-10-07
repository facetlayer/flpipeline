import { execSync } from 'child_process';

export interface OpenRequest {
    initialCommand: string;
    windowName: string;
}

export function openITermWindow(request: OpenRequest): void {
    console.log('Opening iTerm in new worktree directory...');

    // Use osascript directly
    const escapedCommands = request.initialCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "'");
    const escapedWindowName = request.windowName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const osaScript = `
        tell application "iTerm"
            create window with default profile
            tell current session of current window
                set name to "${escapedWindowName}"
                write text "${escapedCommands}"
            end tell
        end tell
    `;
    execSync(`osascript -e '${osaScript}'`);
}
