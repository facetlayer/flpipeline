# Best Practice: Using XDG Environment Variables for Local State Directories

## Overview

When building applications that need to store persistent data locally, it's important to follow established conventions for where that data should be stored. The XDG Base Directory Specification provides a standard way to organize user data directories on Unix-like systems.

## The Pattern

Applications should respect user preferences for data storage locations while providing sensible defaults. The recommended approach is:

1. **Custom Environment Variable**: Check for a project-specific environment variable first
2. **XDG Standard**: Fall back to the XDG_STATE_HOME environment variable
3. **XDG Default**: Use the standard XDG default location as final fallback

## Implementation

Here's a robust implementation pattern you can adapt for your project:

```typescript
import Path from 'path';
import os from 'os';

export function getStateDirectory(): string {
  // First: Use PROJECT_STATE_DIR if set (replace with your project name)
  if (process.env.PROJECT_STATE_DIR) {
    return process.env.PROJECT_STATE_DIR;
  }

  // Next: Use XDG_STATE_HOME if set
  if (process.env.XDG_STATE_HOME) {
    return Path.join(process.env.XDG_STATE_HOME, 'your-project-name');
  }

  // Default: Use the XDG style default: ~/.local/state/your-project-name/
  return Path.join(os.homedir(), '.local', 'state', 'your-project-name');
}
```

## Benefits

This approach provides several advantages:

- **User Control**: Users can override the default location by setting environment variables
- **Standards Compliance**: Follows the XDG Base Directory Specification
- **Predictable Defaults**: When no environment variables are set, uses a standard location
- **Testing Friendly**: Easy to redirect state to temporary directories during testing

## Usage Examples

```bash
# Use a custom directory for this session
export PROJECT_STATE_DIR=/tmp/my-project-state
your-app

# Use XDG standard with custom base
export XDG_STATE_HOME=/custom/state/location
your-app  # Will store data in /custom/state/location/your-project-name

# Use default location
your-app  # Will store data in ~/.local/state/your-project-name
```

## Additional Considerations

- Always create the directory if it doesn't exist before writing to it
- Consider using different subdirectories for different types of state data
- On non-Unix systems, you may want to adapt the default path appropriately
- Document these environment variables in your project's README

This pattern ensures your application plays nicely with user preferences and system conventions while maintaining reliable defaults.