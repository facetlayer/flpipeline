# Config File

## Intention

The flpipeline tools require a project configuration file to define project-specific settings and services. This configuration file allows users to customize the behavior of flpipeline tools for their specific project needs.

## Functional Requirements

### Configuration File Location
- The configuration file must be named `.flpipeline.json`
- The system must search for this file recursively starting from the current working directory and traversing up the directory tree until found or reaching the filesystem root
- The search should stop at the first `.flpipeline.json` file found

### Configuration File Structure
- The configuration file must be valid JSON
- The file must define a `ProjectConfig` interface that specifies the expected structure
- The configuration should support defining multiple services with their respective settings

### Error Handling
- If no configuration file is found during the recursive search, a `MissingConfigFileError` should be thrown
- The error should provide clear information about where the system looked for the configuration file

### API
- Export a `findConfigFile()` function that returns the path to the found configuration file
- Export a `ProjectConfig` interface defining the expected configuration structure
- The function should handle the recursive directory traversal automatically

## Related Source Files
- `src/config/findConfigFile.ts` - Main implementation file containing the findConfigFile function and ProjectConfig interface
- `src/errors.ts` - Error class definitions including MissingConfigFileError

## Usage Example
```typescript
import { findConfigFile, ProjectConfig } from './config/findConfigFile.js';

try {
  const configPath = findConfigFile();
  const config: ProjectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('Found config:', config);
} catch (error) {
  if (error instanceof MissingConfigFileError) {
    console.error('No .flpipeline.json found in current directory or parents');
  }
}
```