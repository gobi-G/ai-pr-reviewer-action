import { z } from 'zod';
import { Issue } from '../analyzers';
import { ChangedFile } from '../github';

export const reviewResponseSchema = z.object({
  comment: z.string().describe('The full markdown comment to post on the PR'),
  confidence: z.number().min(0).max(1).describe('Confidence level of the review (0-1)'),
  categories: z
    .array(z.enum(['accessibility', 'performance', 'security']))
    .describe('Categories of issues found'),
});

export type ReviewResponse = z.infer<typeof reviewResponseSchema>;

export function generateReviewPrompt(issues: Issue[], changedFiles: ChangedFile[]): string {
  const systemPrompt = `You are an expert code reviewer specializing in web development, accessibility, performance, and security. Your task is to review pull request changes and provide constructive feedback.

Guidelines:
- Be helpful and educational
- Provide specific, actionable suggestions
- Focus on the most important issues
- Use a friendly but professional tone
- Format your response in markdown
- Include code examples when helpful
- Prioritize issues by severity (high > medium > low)

Response format: You MUST respond with valid JSON matching this schema:
{
  "comment": "Full markdown comment to post on PR",
  "confidence": 0.0-1.0,
  "categories": ["accessibility", "performance", "security"]
}`;

  const issuesSummary = issues
    .map(
      issue =>
        `- **${issue.type}** (${issue.severity}): ${issue.message} in \`${issue.file}\`${issue.suggestion ? `\n  💡 ${issue.suggestion}` : ''}`
    )
    .join('\n');

  const filesSummary = changedFiles
    .map(file => `- \`${file.filename}\` (${file.status})`)
    .join('\n');

  const userPrompt = `Please review this pull request:

## Changed Files
${filesSummary}

## Issues Found by Static Analysis
${issuesSummary}

Based on these findings, please provide a comprehensive review comment that:
1. Summarizes the overall code quality
2. Highlights the most critical issues
3. Provides specific recommendations for improvement
4. Acknowledges any good practices observed

Focus on being educational and helpful. If there are no significant issues, provide encouragement and any minor suggestions for improvement.`;

  return `${systemPrompt}\n\n${userPrompt}`;
}
