---
description: Running TypeScript with Node.js built-in type stripping
---

# Running TypeScript with Node.js Built-in Type Stripping

## Overview

Node.js can execute TypeScript files directly using built-in type stripping. This feature strips type annotations at runtime without a separate compilation step.

This is an alternative to using tools like `ts-node` or `tsx`

## Version Requirements

- **Node.js 24 or above**: Type stripping works without any special flags
- **Earlier versions**: Requires a special flag.

## How to Use

Simply run TypeScript files directly with Node:

```bash
node script.ts
```

No transpilation step is needed - Node.js strips the types at runtime.

## Important Limitations

When using type stripping mode, certain TypeScript features are NOT supported:

### Unsupported Features

- **Enums**: TypeScript enums cannot be used in this mode
- **Namespace declarations**: Not supported
- **Legacy module syntax**: Some older TypeScript patterns may not work
- **Type-only imports/exports with runtime side effects**: May cause issues

### What IS Supported

- Type annotations
- Interfaces
- Type aliases
- Generic types
- Most modern TypeScript syntax

## Required Configuration Changes

### 1. Import from .ts Files

You must explicitly include the `.ts` extension in your imports:

```typescript
// ✅ Correct
import { myFunction } from './utils.ts';
import { MyClass } from './services/MyClass.ts';

// ❌ Incorrect (won't work with type stripping)
import { myFunction } from './utils';
import { MyClass } from './services/MyClass';
```

### 2. Update tsconfig.json

In this mode it's important to modify the `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "noEmit": true
  }
}
```

Key settings:
- `"allowImportingTsExtensions": true` - Allows importing from `.ts` files
- `"noEmit": true` - Prevents TypeScript from generating output files (since Node runs the .ts files directly)
- `"moduleResolution": "bundler"` - Use modern module resolution

## Migration from Traditional TypeScript

If migrating from a traditional `tsc` compilation setup:

1. Add `.ts` extensions to all imports
2. Update `tsconfig.json` with the required settings
3. Replace any enums with const objects or unions
4. Test thoroughly - some edge cases may behave differently

