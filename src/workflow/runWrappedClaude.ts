import * as pty from 'node-pty';

export async function runWrappedClaude(prompt: string): Promise<void> {
    console.log('Starting Claude in wrapped mode...');
    
    // Use node-pty to create a proper pseudo-TTY for Claude
    const claudeProcess = pty.spawn('claude', ['--permission-mode', 'acceptEdits', prompt], {
        name: 'xterm-256color',
        cols: process.stdout.columns || 120,
        rows: process.stdout.rows || 30,
        cwd: process.cwd(),
        env: {
            ...process.env,
            TERM: 'xterm-256color',
            FORCE_COLOR: '1'
        }
    });
    
    let trustPromptHandled = false;
    let outputBuffer = '';
    
    // Forward stdin from parent process to Claude
    process.stdin.setRawMode(true);
    process.stdin.on('data', (data) => {
        claudeProcess.write(data.toString());
    });
    
    // Handle output from Claude
    claudeProcess.onData((data: string) => {
        process.stdout.write(data);
        
        // Add to buffer for trust prompt detection
        outputBuffer += data;
        
        // Check for trust prompt and respond automatically (only once)
        if (!trustPromptHandled && outputBuffer.includes('Yes, proceed')) {
            trustPromptHandled = true;
            setTimeout(() => {
                console.log('[autoresponding with "1"]');
                claudeProcess.write('1');
                setTimeout(() => {
                    claudeProcess.write('\r');
                }, 100);
            }, 2000);
        }
        
        // Keep only recent output in buffer to avoid memory issues
        if (outputBuffer.length > 10000) {
            outputBuffer = outputBuffer.slice(-5000);
        }
    });
    
    // Handle process exit
    claudeProcess.onExit(({ exitCode, signal }) => {
        console.log(`Claude process exited with code ${exitCode} and signal ${signal}`);
    });
    
    return new Promise((resolve, reject) => {
        claudeProcess.onExit(({ exitCode, signal }) => {
            // Restore normal terminal mode
            process.stdin.setRawMode(false);
            
            if (exitCode === 0) {
                resolve();
            } else {
                reject(new Error(`Claude exited with code ${exitCode} (signal: ${signal})`));
            }
        });
        
        // Handle any errors
        claudeProcess.onData((data: string) => {
            if (data.includes('Error:') || data.includes('Failed:')) {
                console.error('Detected error in Claude output:', data);
            }
        });
    });
}
