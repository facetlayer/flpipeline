---
description: Facetlayer opinionated fullstack architecture pattern with PNPM monorepo
---

# Facetlayer Opinionated Fullstack Architecture

This document describes an opinionated architecture pattern for fullstack TypeScript applications using a monorepo setup.

## Monorepo Setup with PNPM

The project uses PNPM workspaces for managing multiple packages in a single repository.

### Root Configuration

**pnpm-workspace.yaml**
```yaml
packages:
  - "api"
  - "web"
  - "web-functional-test"
  - "tools"
```

**Root package.json**
```json
{
  "packageManager": "pnpm@10.15.1",
  "scripts": {
    "test": "cd api && vitest run",
    "web:test": "cd web-functional-test && vitest run",
    "test:watch": "cd api && vitest"
  },
  "private": true
}
```

## Backend: ./api Directory

The `./api` directory contains an Express.js-based web server.

### Special Directories

#### ./api/src/_main

Contains entry points and initialization code.

This directory has:
- Application entry points (e.g., `main.ts`)
- Singleton objects and global state
- Server initialization logic

#### ./api/src/_framework

Contains the web framework implementation.

This includes:
- Express.js setup and middleware
- Request/response handling utilities
- Framework-level abstractions

#### ./api/src/_libs

Contains standalone shared libraries.

These are reusable libraries that:
- Act like independent packages
- Have no dependencies on the rest of the application
- Could potentially be extracted to separate NPM packages
- Provide generic functionality (e.g., sqlite-wrapper, llm-client, stream-bus)

Examples:
```
./api/src/_libs/
  json-subprocess/
  llm-client/
  llm-conversation/
  sqlite-wrapper/
  stream-bus/
```

#### ./api/src/_testing

Contains testing utilities and helpers used across tests.

### Service-Based Architecture

The remaining directories in `./api/src/*` are organized as **services**.

Each service represents a feature area, topic, or business domain.

#### Service Directory Structure

A typical service directory contains:

```
./api/src/<service-name>/
  __tests__/          # Tests for this service
  actions/            # Business logic functions
  database/           # Database schemas and migrations
  endpoints.ts        # API endpoint definitions
  helpers/            # Service-specific utility functions
  index.ts            # Service exports and registration
  schemas/            # Zod validation schemas
```

#### Service Organization Principles

- Each service is **self-contained** with its own endpoints, actions, and database tables
- Services can depend on other services but should minimize coupling
- Service names use **snake_case** (e.g., `auth`, `mcp_integration`, `test_script_execution`)
- Each service exports its public API through `index.ts`

## Frontend: ./web Directory

The `./web` directory contains a Next.js application for the frontend.

### Web Directory Structure

```
./web/src/
  api/                 # Client-side API integration
  api-client.ts        # API client configuration
  app/                 # Next.js app router pages
  components/          # Shared React components (may have logic)
  ui/                  # Pure styling components (no business logic)
  landing/             # Landing and marketing pages
  studio/              # Desktop app UI (if applicable)
  lib/                 # Utility libraries
  providers/           # React context providers
  test-setup.ts        # Test configuration
```

### Component Organization

#### ./web/src/components/

Shared components used across various screens.

These components:
- May contain business logic
- Are reused in multiple places
- Handle complex interactions

#### ./web/src/ui/

Pure styling components.

These components:
- Focus only on visual presentation
- Should NOT contain business logic
- Are purely presentational/stylistic
- Can be reused across different contexts

### API Integration

#### ./web/src/api/

Contains client implementations for using the backend API.

This includes:
- API request functions
- Type definitions for API responses
- Client-side data fetching logic

## Project Structure Summary

```
project-root/
├── pnpm-workspace.yaml         # PNPM workspace configuration
├── package.json                # Root package with scripts
├── api/                        # Express.js backend
│   ├── package.json
│   └── src/
│       ├── _main/             # Entry points and singletons
│       ├── _framework/        # Web framework implementation
│       ├── _libs/             # Standalone shared libraries
│       ├── _testing/          # Test utilities
│       └── <service>/         # Service directories (auth, mcp_integration, etc.)
│           ├── __tests__/
│           ├── actions/
│           ├── database/
│           ├── endpoints.ts
│           ├── helpers/
│           ├── index.ts
│           └── schemas/
├── web/                        # Next.js frontend
│   ├── package.json
│   └── src/
│       ├── api/               # API client
│       ├── app/               # Next.js pages
│       ├── components/        # Shared components (with logic)
│       ├── ui/                # Pure styling components
│       ├── landing/           # Landing pages
│       └── lib/               # Utilities
├── web-functional-test/        # Playwright functional tests
├── tools/                      # Development utilities
└── docs/                       # Project documentation
```

## Key Principles

1. **Monorepo with PNPM**: Single repository with multiple packages managed by PNPM workspaces
2. **Service-Based Backend**: Backend organized into self-contained services by feature/domain
3. **Separation of Concerns**: Clear distinction between framework (`_framework`), libraries (`_libs`), and services
4. **Component Organization**: Frontend separates business logic components from pure UI components
5. **Shared Libraries**: Reusable code in `_libs` acts as standalone packages
6. **Testing**: Each service has its own test directory; functional tests in separate package
