import { logger } from '../utils/log';
import { ReviewResponse, reviewResponseSchema } from './prompts';

export interface LLMProvider {
  generateReview(prompt: string): Promise<ReviewResponse>;
}

export function getLLMProvider(provider: string, apiKey?: string, baseUrl?: string): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'mock':
      return new MockProvider();
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'ollama':
      return new OllamaProvider(baseUrl);
    default:
      logger.warn(`Unknown provider '${provider}', falling back to mock`);
      return new MockProvider();
  }
}

class MockProvider implements LLMProvider {
  async generateReview(_prompt: string): Promise<ReviewResponse> {
    logger.info('Using mock provider - generating synthetic review');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      comment: `## 🤖 AI PR Review (Mock Mode)

I've analyzed your pull request and found some areas for improvement:

### 🔍 Summary
This is a mock review generated for testing purposes. In production, this would contain AI-generated insights about your code changes.

### 💡 Suggestions
- Consider reviewing the accessibility of your UI components
- Check for any performance optimizations
- Ensure security best practices are followed

*This review was generated using the mock AI provider. Configure a real AI provider to get actual insights.*`,
      confidence: 0.8,
      categories: ['accessibility', 'performance', 'security'],
    };
  }
}

class OpenAIProvider implements LLMProvider {
  constructor(private apiKey?: string) {}

  async generateReview(prompt: string): Promise<ReviewResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required but not provided');
    }

    logger.info('Calling OpenAI API for review generation');

    const response = await this.makeRequest(prompt);

    try {
      const parsed = reviewResponseSchema.parse(response);
      return parsed;
    } catch (error) {
      logger.error('Failed to parse OpenAI response', error);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  private async makeRequest(prompt: string, retries = 3): Promise<unknown> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 2000,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        return JSON.parse(data.choices[0]!.message.content);
      } catch (error) {
        logger.warn(`OpenAI request attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
    throw new Error('All retry attempts failed');
  }
}

class OllamaProvider implements LLMProvider {
  constructor(private baseUrl?: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434';
  }

  async generateReview(prompt: string): Promise<ReviewResponse> {
    logger.info(`Calling Ollama API at ${this.baseUrl} for review generation`);

    const response = await this.makeRequest(prompt);

    try {
      const parsed = reviewResponseSchema.parse(response);
      return parsed;
    } catch (error) {
      logger.error('Failed to parse Ollama response', error);
      throw new Error('Invalid response format from Ollama');
    }
  }

  private async makeRequest(prompt: string, retries = 3): Promise<unknown> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for local

        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.1',
            prompt,
            stream: false,
            format: 'json',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as { response: string };
        return JSON.parse(data.response);
      } catch (error) {
        logger.warn(`Ollama request attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
      }
    }
    throw new Error('All retry attempts failed');
  }
}
