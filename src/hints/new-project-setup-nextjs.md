---
description: How to set up a new Next.js web project
---

## How to Set up a Next.js Web Project

- Use the latest version of Next.js
- Enable TypeScript and ESLint
- Enable Tailwind CSS
- Do NOT enable Turbopack
- Do not customize the import alias

A typical command looks like:

    $ npx create-next-app@latest web --typescript --eslint --tailwind --app --src-dir --import-alias="@/*"

## Code Organization
Create the following directory structure and files:

1. Add a directory `./src/components` for shared UI components
   - Create `Button.tsx` (reusable button component)
   - Create `Header.tsx` (common sitewide header)
   - Create `Footer.tsx` (common sitewide footer)

2. Add a file `./src/Configs.ts` with configuration values:
   ```typescript
   export const WEBSITE_URL = 'https://example.com';
   export const WEBSITE_NAME = 'My Website';
   export const WEBSITE_DOMAIN = 'example.com';
   ```

# Configuration for static export

Make sure the next.config.ts file is modified to enable static file export:

    const nextConfig: NextConfig = {
      output: 'export',
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
    };

## CSS Guidelines
- Use a mixture of Tailwind classes and custom atomic-style CSS classes
- Store custom atomic CSS in `globals.css`
- For every React component, add the component's full name as a CSS class

Example:
```typescript
const SinglePageTile = (props) => {
    return <div className="SinglePageTile border border-gray rounded-lg">
        ...
    </div>
}
```

## CSS Usage Rules

- Use Tailwind classes for: spacing, layout (grid, flex), margin, padding, one-off designs
- Use Atomic CSS classes for: common shared elements (buttons, links), site theme (colors, fonts)
- Feel free to use @apply in atomic CSS classes to reference Tailwind classes

## SEO

The site should have good SEO tagging enabled, including appropriate keywords, a robots.txt file, a canonical URL,
and an accurate sitemap.xml

## Analytics

The site should add a Google Analytics tag.

## Next Steps

Ask the user for more information and then create the project.

You'll need to find out:

 - The website name and domain
 - The desired look and feel of the website style
 - The purpose of the website
