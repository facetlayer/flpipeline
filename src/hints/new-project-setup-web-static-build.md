---
description: Guidelines for using Next.js with static builds only
---

# Next.js Static Build

This guidelines applies to projects that are using Next.js for "static builds" only.

When used this way, the project will use Next.js's "export" command to create static files
when serving the project.

This method does NOT run Next.js as an API server. Projects using this method should
not have any endpoints written in the api/ folder.

Any required APIs will need to be implemented in a separate server.
