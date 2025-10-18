import { readFileSync } from 'fs';
import { join } from 'path';
import { getListing, GetListingOptions, HintInfo } from './getListing.js';
import { PROJECT_ROOT_DIR } from '../dirs.js';
import { LLMService } from './llm-service.js';
import { OllamaLLMService } from './llm-services/ollama-service.js';

/**
 * Options for the getRelevantHints function
 */
export interface GetRelevantHintsOptions extends GetListingOptions {
  /**
   * The LLM service to use for hint selection.
   * If not provided, defaults to OllamaLLMService with default configuration.
   */
  llmService?: LLMService;

  /**
   * The model to use for hint selection.
   * If not provided, uses the LLM service's default model.
   */
  model?: string;

  /**
   * Temperature for LLM generation (0.0 to 1.0).
   * Lower values = more deterministic. Defaults to 0.3
   */
  temperature?: number;

  /**
   * Maximum number of hints to return. Defaults to 5
   */
  maxHints?: number;
}

/**
 * Class representing found hints with methods to access their content
 */
export class FoundHints {
  private hintNames: string[];
  private hintsDir: string;

  constructor(hintNames: string[], hintsDir: string = join(PROJECT_ROOT_DIR, 'src/hints')) {
    this.hintNames = hintNames;
    this.hintsDir = hintsDir;
  }

  /**
   * Get the list of hint names
   */
  getHintNames(): string[] {
    return [...this.hintNames];
  }

  /**
   * Get the number of hints found
   */
  getCount(): number {
    return this.hintNames.length;
  }

  /**
   * Check if any hints were found
   */
  hasHints(): boolean {
    return this.hintNames.length > 0;
  }

  /**
   * Get the full content of a specific hint file
   * @param hintName - The name of the hint file (without .md extension)
   * @returns The full content of the hint file
   */
  getHintContent(hintName: string): string {
    try {
      const filePath = join(this.hintsDir, `${hintName}.md`);
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read hint file ${hintName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the full content of all hint files
   * @returns An array of objects containing hint names and their content
   */
  getAllHintContents(): Array<{ name: string; content: string }> {
    return this.hintNames.map(name => ({
      name,
      content: this.getHintContent(name)
    }));
  }

  /**
   * Get the full content of all hints as a single concatenated string
   * @param separator - The separator to use between hints. Defaults to '\n\n---\n\n'
   * @returns All hint contents concatenated together
   */
  getConcatenatedContent(separator: string = '\n\n---\n\n'): string {
    return this.getAllHintContents()
      .map(({ name, content }) => `# ${name}\n\n${content}`)
      .join(separator);
  }
}

/**
 * Get relevant hints based on input text using an LLM
 *
 * @param inputText - The input text to find relevant hints for
 * @param options - Options for finding relevant hints
 * @returns A FoundHints instance containing the relevant hint names
 */
export async function getRelevantHints(
  inputText: string,
  options?: GetRelevantHintsOptions
): Promise<FoundHints> {
  const {
    patterns,
    llmService = new OllamaLLMService(),
    model,
    temperature = 0.3,
    maxHints = 5
  } = options || {};

  // Fetch the detailed listing of all hints
  const hintInfos = await getListing({ patterns });

  if (hintInfos.length === 0) {
    return new FoundHints([]);
  }

  // Format hints for the prompt
  const formattedHints = hintInfos.map((info, idx) => {
    let line = `${idx + 1}. ${info.name} - ${info.description}`;
    if (info.relevant_for) {
      line += `\n   Relevant for: ${info.relevant_for}`;
    }
    return line;
  }).join('\n');

  // Construct the prompt for the LLM
  const prompt = `You are a helpful assistant that selects the most relevant hint files for a user's request.

Available hint files:
${formattedHints}

Your task:
- Analyze the user's request and return ONLY the hints that are truly relevant
- Pay close attention to the "Relevant for" field - this specifies when each hint should be used
- Return 0-${maxHints} hints (fewer is better if others aren't relevant)
- Match the user's task to the hint's "Relevant for" criteria

User's request: ${inputText}

Respond with ONLY a JSON array of hint file names (without the .md extension).
Examples: ["hint-name-1", "hint-name-2"] or [] if none are relevant.`;

  try {
    // Send the prompt to the LLM service
    const response = await llmService.generate(prompt, {
      model,
      temperature,
    });

    // Extract the response text
    const responseText = response.text;

    // Parse the JSON response
    let hintNames: string[];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        hintNames = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      throw new Error(`Failed to parse hint selection from LLM: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate that all hint names exist in the listing
    const availableHintNames = hintInfos.map(info => info.name);
    const validHintNames = hintNames.filter(name => availableHintNames.includes(name));

    // Return only valid hints, or empty if none found
    return new FoundHints(validHintNames.slice(0, maxHints));

  } catch (error) {
    console.error('Error querying LLM for hint selection:', error);
    throw new Error(`Failed to get relevant hints: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
