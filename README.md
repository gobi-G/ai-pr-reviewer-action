# AI PR Reviewer Action

An intelligent GitHub Action that analyzes pull requests for accessibility, performance, and security issues using AI.

## Features

- 🔍 **Static Analysis**: Scans code for common issues in accessibility, performance, and security
- 🤖 **AI-Powered Reviews**: Uses LLM providers to generate intelligent, contextual feedback
- 🔌 **Provider Agnostic**: Supports OpenAI, Ollama, and mock providers
- ⚡ **Fast & Efficient**: Bundles to a single file with minimal dependencies
- 🛡️ **Graceful Degradation**: Works even without AI configuration (mock mode)

## Usage

### Basic Setup

```yaml
name: AI PR Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  pull-requests: write
  contents: read

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-username/ai-pr-reviewer-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-provider: 'openai'
          ai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Inputs

| Input          | Description                              | Required | Default               |
| -------------- | ---------------------------------------- | -------- | --------------------- |
| `github-token` | GitHub token for API access              | Yes      | `${{ github.token }}` |
| `ai-provider`  | AI provider (`mock`, `openai`, `ollama`) | No       | `mock`                |
| `ai-api-key`   | API key for the AI provider              | No       | `''`                  |
| `ai-base-url`  | Base URL for Ollama provider             | No       | `''`                  |

### Providers

#### Mock Provider (Default)

Perfect for testing and development. Generates synthetic reviews without external API calls.

```yaml
- uses: your-username/ai-pr-reviewer-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    ai-provider: 'mock'
```

#### OpenAI Provider

Uses OpenAI's GPT models for intelligent code reviews.

```yaml
- uses: your-username/ai-pr-reviewer-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    ai-provider: 'openai'
    ai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

#### Ollama Provider

Uses self-hosted Ollama for private AI reviews.

```yaml
- uses: your-username/ai-pr-reviewer-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    ai-provider: 'ollama'
    ai-base-url: 'http://your-ollama-server:11434'
```

## Development

### Prerequisites

- Node.js 20+
- Yarn

### Setup

```bash
yarn install
```

### Scripts

```bash
yarn build        # Build the action
yarn typecheck    # Type checking
yarn format       # Format code
yarn format:check # Check formatting
yarn test         # Run tests (placeholder)
```

### Building

The action is bundled using `@vercel/ncc` to create a single `dist/index.js` file:

```bash
yarn build
```

Make sure to commit the `dist/` directory after building.

## How It Works

1. **File Analysis**: Scans changed files in the PR for supported file types
2. **Static Analysis**: Runs lightweight analyzers for accessibility, performance, and security
3. **AI Review**: Sends findings to configured AI provider for intelligent analysis
4. **Comment Generation**: Posts a comprehensive review comment on the PR

### Analyzers

#### Accessibility

- Missing alt text on images
- Form inputs without proper labels
- Heading hierarchy issues
- Unsafe innerHTML usage

#### Performance

- Heavy library imports (lodash, moment, etc.)
- Blocking synchronous operations
- Inefficient DOM queries
- Missing image optimization

#### Security

- Usage of `eval()`
- `dangerouslySetInnerHTML` without sanitization
- `target="_blank"` without `rel="noopener"`
- Hardcoded credentials
- Insecure HTTP URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `yarn build` and commit the `dist/` changes
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.
