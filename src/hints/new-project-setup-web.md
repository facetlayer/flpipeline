---
description: Guidelines for developing frontend web apps
---

# Web Coding Guidelines

This are guidelines for developing a frontend web app.

### Library

Use the latest version of Next.js

When setting up a project, make sure:
 - Typescript and ESLint are enabled
 - Tailwind is enabled
 - Turbopack is not enabled

### Code Organization #

Add a directory `./src/components` which has shared UI components.

Common components to store here are:
 - Button.tsx (reusable `<button>` class)
 - Header.tsx (common sitewide header)
 - Footer.tsx (common sitewide footer)

Add more as needed for the project.

Add a file `./src/Configs.ts` which includes reused configuration-style values.

This file should include the public URL for the current project, and other settings as needed.

Example:

```
export const WEBSITE_URL = 'https://thewebsite.com';
export const WEBSITE_NAME = 'The WebsiteName';
export const WEBSITE_DOMAIN = 'thewebsite.com';
```


## CSS Guidelines

## Atomic CSS Class Usage

The page will use a mixture of Tailwind classes and custom atomic-style CSS classes.

Atomic CSS classes are encouraged especially for reused styles that represent the style and theme.

This CSS is stored in `globals.css`.

## CSS Style - Component Names as Classes

Whenever there is a named React component, you should add the component's full name to the `className` of the output.

Example:

    const SinglePageTile(props) {
        return <div className="SinglePageTile border border-gray rounded-lg">
            ...
        </div>
    }

In that example, SinglePageTile is the name of the React component and it's also added as a
CSS class. The component additionally has some Tailwind classes for styling.

These 'component name' CSS classes won't have any styling rules - they're only used to
understand the HTML when debugging, and to use as selectors in automated tests.

### Use Tailwind classes for:

- Spacing and layout (grid settings, flex settings, margin, padding)
- One-off designs or layouts that are only used in one place.

### Use Atomic CSS classes for:

- Common shared elements: buttons, links
- Things that represent the site theme: colors, font styling

When defining atomic CSS classes, feel free to use @apply to reference Tailwind classes (for colors or etc).

## Config Values in Web Projects

For non-secret config values, create a file src/Configs.ts which exports config values.

One common config is WEBSITE_PUBLIC_URL='https://...' which has the public URL for the web app.
