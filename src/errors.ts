export class MissingConfigFileError extends Error {
  constructor(searchPaths: string[]) {
    const message = `No .flpipeline.json configuration file found. Searched in:\n${searchPaths.map(path => `  - ${path}`).join('\n')}`;
    super(message);
    this.name = 'MissingConfigFileError';
  }
}