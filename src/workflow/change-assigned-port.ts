#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function updateEnvFile(filePath: string, newPort: number): void {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let portLineFound = false;
    const updatedLines = lines.map(line => {
      if (line.startsWith('PORT=')) {
        portLineFound = true;
        return `PORT=${newPort}`;
      }
      return line;
    });
    
    // If no PORT line was found, add it
    if (!portLineFound) {
      // Find a good place to insert it - after existing config lines but before empty lines at the end
      let insertIndex = updatedLines.length;
      
      // Remove trailing empty lines to find insertion point
      while (insertIndex > 0 && updatedLines[insertIndex - 1].trim() === '') {
        insertIndex--;
      }
      
      updatedLines.splice(insertIndex, 0, `PORT=${newPort}`);
    }
    
    writeFileSync(filePath, updatedLines.join('\n'));
    console.log(`Updated ${filePath} with PORT=${newPort}`);
  } catch (error) {
    console.error(`Failed to update ${filePath}:`, error);
    throw error;
  }
}

export function changeAssignedPort(app: 'api' | 'web', port: number): void {
  if (app !== 'api' && app !== 'web') {
    throw new Error(`Invalid app: ${app}. Must be 'api' or 'web'`);
  }
  
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${port}. Must be an integer between 1 and 65535`);
  }
  
  const envFilePath = join(process.cwd(), app, '.env');
  updateEnvFile(envFilePath, port);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length !== 4) {
    console.error('Usage: change-assigned-port.ts --app <app> --port <port>');
    console.error('  app: "api" or "web"');
    console.error('  port: integer between 1 and 65535');
    process.exit(1);
  }
  
  const appIndex = args.indexOf('--app');
  const portIndex = args.indexOf('--port');
  
  if (appIndex === -1 || portIndex === -1) {
    console.error('Both --app and --port arguments are required');
    process.exit(1);
  }
  
  if (appIndex + 1 >= args.length || portIndex + 1 >= args.length) {
    console.error('Missing values for --app or --port arguments');
    process.exit(1);
  }
  
  const app = args[appIndex + 1] as 'api' | 'web';
  const portStr = args[portIndex + 1];
  const port = parseInt(portStr, 10);
  
  if (isNaN(port)) {
    console.error(`Invalid port value: ${portStr}. Must be a number`);
    process.exit(1);
  }
  
  try {
    changeAssignedPort(app, port);
    console.log(`Successfully changed ${app} port to ${port}`);
  } catch (error) {
    console.error('Failed to change port:', error);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { main };