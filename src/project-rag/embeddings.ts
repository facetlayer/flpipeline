import { Ollama } from 'ollama';

export class EmbeddingService {
  private ollama: Ollama;

  constructor(baseURL?: string) {
    this.ollama = new Ollama({
      host: baseURL || process.env.OLLAMA_HOST || 'http://localhost:11434',
    });
  }

  async generateEmbedding(text: string): Promise<Float32Array> {
    try {
      const response = await this.ollama.embeddings({
        model: 'nomic-embed-text',
        prompt: text,
      });
      return new Float32Array(response.embedding);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
    try {
      const embeddings: Float32Array[] = [];
      for (const text of texts) {
        const response = await this.ollama.embeddings({
          model: 'nomic-embed-text',
          prompt: text,
        });
        embeddings.push(new Float32Array(response.embedding));
      }
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static preprocessText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) chunks.push(currentChunk + '.');
        currentChunk = trimmedSentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk + '.');
    return chunks.filter(chunk => chunk.trim().length > 0);
  }
}

