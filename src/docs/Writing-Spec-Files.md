
# Writing Spec Files

Every project using the flpipeline tools will have a top level ./agentspec directory
(create this directory for new projects).

This contains a nested tree of MD files that describe how each feature should work.

The spec file should include:
 - The intention or goal behind the feature
 - The functional requirements
 - How to handle edge cases
 - The source code file(s) related to this feature. Often there will be a 1-to-1
   corrleation of spec file to source code file, and sometimes one spec file will
   relate to multiple source files.
 - Other contextual information.

## How spec files are used

Spec files serve as live documentation for the app's features. They are used:

 - When the feature is updated or refactored.
 - When creating a test plan and figuring out what requirements to test.
 - In some cases, used as the source when regenerating or reimplementing the code.
 - As a reference when creating documentation (both internal and public docs)

## Spec file directory organization

In the ./agentspec folder there may be subdirectories to help organize the .md files.

Each project may have a custom directory naming scheme that makes sense for the
project.

Examples:
 - For a website, there may be a separate .md file to describe each page URL.
 - For an API server, there may be a separate .md file to describe each endpoint.
 - For a CLI app, there may be a separate .md file to describe each command.
 - For a SQL database, there may be a separate .md file to describe each table.

When adding a new spec file, make sure you understand and follow the project's
directory naming scheme.

## Workflow

When creating a new feature, you should also create a spec file (if there isn't one
already). The spec file should capture the text of the original request as the
requirements. 

When modifying a feature, you should also modify the spec file to capture any change
in desired behavior or requirements.

