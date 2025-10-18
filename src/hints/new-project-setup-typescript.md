---
description: How to set up a new TypeScript project
---

Notes on setting up a Typescript based project.

## Code organization ##

 - All Typescript code is stored in `src/`

## Typescript tsconfig.json settings ##

 - Disable 'strict' mode
 - Enable 'noImplicitAny'
 - 'outDir' should be 'dist'
 - Use "module": "commonjs"

## Testing

Add Vitest for unit testing.

Make sure there is a `"test": "vitest"` command in the `scripts` section in package.json.

## Dev server

Use the `tsc-watch` command for testing.

There should be a command that looks like this in the `scripts` section of package.json:

    "dev": "tsc-watch -p . --onSuccess \"node dist/main.js\""


## Command line tool settings (Node.js tools) ##

 - If the project is designed to run as a command-line tool then it should have a file `src/main.ts`
 - The main file should use `import 'source-map-support/register'` (make sure this package is installed)
 - The main file should export a `main()` function
 - The project should have a `bin/` folder which includes a pure Node.js script with the projects name
   - Example file name: `bin/my-tool`
   - This file should be marked executable
   - This file should have `#! /usr/bin/env node` at the top.
   - This file should contain this basic wrapper:

        const { main } = require('../dist/main.js');

        main()
        .catch(error => {
            console.error(error);
            process.exitCode = -1;
        });


