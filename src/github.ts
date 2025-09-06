import * as github from '@actions/github';
import { logger } from './utils/log';

export interface ChangedFile {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  patch?: string | undefined;
  contents?: string | undefined;
}

export async function getChangedFiles(token: string): Promise<ChangedFile[]> {
  const octokit = github.getOctokit(token);
  const { context } = github;

  if (!context.payload.pull_request) {
    throw new Error('No pull request context available');
  }

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
  });

  const changedFiles: ChangedFile[] = [];

  for (const file of files) {
    // Skip very large files
    if (file.changes && file.changes > 1000) {
      continue;
    }

    // Only analyze relevant file types
    if (!isAnalyzableFile(file.filename)) {
      continue;
    }

    let contents: string | undefined;

    // Get file contents for new or modified files
    if (file.status !== 'removed') {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner: context.repo.owner,
          repo: context.repo.repo,
          path: file.filename,
          ref: context.payload.pull_request.head.sha,
        });

        if ('content' in data && data.content) {
          contents = Buffer.from(data.content, 'base64').toString('utf-8');
        }
      } catch (error) {
        logger.warn(`Failed to get contents for ${file.filename}: ${error}`);
      }
    }

    changedFiles.push({
      filename: file.filename,
      status: file.status as 'added' | 'modified' | 'removed',
      patch: file.patch || undefined,
      contents: contents,
    });
  }

  return changedFiles;
}

export async function postReviewComment(token: string, comment: string): Promise<void> {
  const octokit = github.getOctokit(token);
  const { context } = github;

  if (!context.payload.pull_request) {
    throw new Error('No pull request context available');
  }

  await octokit.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: comment,
  });
}

function isAnalyzableFile(filename: string): boolean {
  const extensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.vue',
    '.svelte',
    '.html',
    '.css',
    '.scss',
    '.less',
  ];
  return extensions.some(ext => filename.endsWith(ext));
}
