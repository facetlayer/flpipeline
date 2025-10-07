import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { UniquePortAssignmentConfig } from '../config/ProjectConfig.js';

function runCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString().trim();
  } catch (error) {
    console.error(`Failed to run command: ${command}`);
    throw error;
  }
}

function getNextPort(): number {
  const portOutput = runCommand('port-assign --next');
  const port = parseInt(portOutput.trim(), 10);
  if (isNaN(port)) {
    throw new Error(`Invalid port from port-assign: ${portOutput}`);
  }
  return port;
}

export async function assignNewPorts(): Promise<void> {
  console.log('Assigning new ports...');

  const config = getLocalConfigs();

  if (!config.uniquePortAssignment) {
    console.log('No uniquePortAssignment config found, skipping port assignment');
    return;
  }

  const portAssignments = new Map<string, number>();

  // Assign ports for each configured port
  for (const portConfig of config.uniquePortAssignment.ports) {
    const port = getNextPort();
    portAssignments.set(portConfig.name, port);
    console.log(`Assigned port ${port} to ${portConfig.name}`);
  }

  // Apply replacements
  for (const replacement of config.uniquePortAssignment.replacements) {
    const filePath = join(process.cwd(), replacement.filename);

    if (!existsSync(filePath)) {
      console.warn(`File not found: ${filePath}, skipping replacement`);
      continue;
    }

    const content = readFileSync(filePath, 'utf8');
    let updatedContent = content;

    // Get the port value for the replacement
    const portValue = portAssignments.get(replacement.replaceWith);
    if (portValue === undefined) {
      console.warn(`Port '${replacement.replaceWith}' not found in assignments, skipping replacement in ${replacement.filename}`);
      continue;
    }

    // Parse the regex from string format (e.g., "/pattern/flags")
    const regexMatch = replacement.match.match(/^\/(.+)\/([gimuy]*)$/);
    if (!regexMatch) {
      console.warn(`Invalid regex format in replacement for ${replacement.filename}: ${replacement.match}`);
      continue;
    }

    const pattern = regexMatch[1];
    const flags = regexMatch[2];
    const regex = new RegExp(pattern, flags);

    // Replace with the port value
    updatedContent = updatedContent.replace(regex, (match) => {
      // Replace the port number in the matched string
      return match.replace(/:\d+/, `:${portValue}`);
    });

    if (updatedContent !== content) {
      writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated ${replacement.filename} with ${replacement.replaceWith}=${portValue}`);
    }
  }
}
