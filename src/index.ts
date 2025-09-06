import * as core from '@actions/core';
import * as github from '@actions/github';
import { getChangedFiles, postReviewComment } from './github';
import { runAnalyzers } from './analyzers';
import { getLLMProvider } from './llm/provider';
import { generateReviewPrompt } from './llm/prompts';
import { logger } from './utils/log';

async function run(): Promise<void> {
  try {
    // Get inputs
    const githubToken = core.getInput('github-token', { required: true });
    const aiProvider = core.getInput('ai-provider') || 'mock';
    const aiApiKey = core.getInput('ai-api-key');
    const aiBaseUrl = core.getInput('ai-base-url');

    logger.info(`Starting AI PR review with provider: ${aiProvider}`);

    // Validate we're in a PR context
    if (github.context.eventName !== 'pull_request') {
      logger.warn('Action only runs on pull_request events');
      return;
    }

    const { pull_request } = github.context.payload;
    if (!pull_request) {
      throw new Error('No pull request found in context');
    }

    // Get changed files
    const changedFiles = await getChangedFiles(githubToken);
    logger.info(`Found ${changedFiles.length} changed files`);

    if (changedFiles.length === 0) {
      logger.info('No files to analyze');
      return;
    }

    // Run analyzers
    const issues = await runAnalyzers(changedFiles);
    logger.info(`Found ${issues.length} potential issues`);

    if (issues.length === 0) {
      logger.info('No issues found, skipping AI review');
      return;
    }

    // Get LLM provider and generate review
    const llmProvider = getLLMProvider(aiProvider, aiApiKey, aiBaseUrl);
    const prompt = generateReviewPrompt(issues, changedFiles);

    const review = await llmProvider.generateReview(prompt);
    logger.info('Generated AI review');

    // Post review comment
    await postReviewComment(githubToken, review.comment);
    logger.info('Posted review comment successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Action failed: ${message}`);
    core.setFailed(message);
  }
}

run();
