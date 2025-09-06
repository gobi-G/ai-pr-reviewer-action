import { ChangedFile } from '../github';
import type { Issue } from './types';

export function analyzeSecurity(file: ChangedFile): Issue[] {
  const issues: Issue[] = [];
  const { filename, contents } = file;

  if (!contents) return issues;

  // Check for eval usage
  const evalUsage = /\beval\s*\(/gi;
  if (evalUsage.test(contents)) {
    issues.push({
      type: 'security',
      severity: 'high',
      file: filename,
      message: 'Usage of eval() detected',
      suggestion: 'Avoid eval() as it can execute arbitrary code and poses security risks',
    });
  }

  // Check for dangerous React patterns
  const dangerouslySetInnerHTML = /dangerouslySetInnerHTML/gi;
  if (dangerouslySetInnerHTML.test(contents)) {
    issues.push({
      type: 'security',
      severity: 'medium',
      file: filename,
      message: 'dangerouslySetInnerHTML usage detected',
      suggestion: 'Ensure content is properly sanitized before using dangerouslySetInnerHTML',
    });
  }

  // Check for target="_blank" without rel="noopener"
  const targetBlankWithoutNoopener =
    /<a[^>]*target=["']_blank["'][^>]*(?!.*rel=["'][^"']*noopener)/gi;
  const blankMatches = contents.match(targetBlankWithoutNoopener);
  if (blankMatches) {
    issues.push({
      type: 'security',
      severity: 'medium',
      file: filename,
      message: `Found ${blankMatches.length} link(s) with target="_blank" without rel="noopener"`,
      suggestion: 'Add rel="noopener noreferrer" to prevent potential security vulnerabilities',
    });
  }

  // Check for hardcoded secrets/credentials
  const secretPatterns = [
    /(?:password|pwd|secret|key|token)\s*[:=]\s*["'][^"']+["']/gi,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
    /access[_-]?token\s*[:=]\s*["'][^"']+["']/gi,
  ];

  for (const pattern of secretPatterns) {
    if (pattern.test(contents)) {
      issues.push({
        type: 'security',
        severity: 'high',
        file: filename,
        message: 'Potential hardcoded credentials detected',
        suggestion: 'Move sensitive data to environment variables or secure configuration',
      });
      break;
    }
  }

  // Check for unsafe HTTP URLs in production code
  const httpUrls = /["']https?:\/\/(?!localhost|127\.0\.0\.1)[^"']*["']/gi;
  const httpMatches = contents.match(httpUrls);
  if (httpMatches) {
    const hasInsecureHttp = httpMatches.some(
      url => url.toLowerCase().startsWith('"http:') || url.toLowerCase().startsWith("'http:")
    );
    if (hasInsecureHttp) {
      issues.push({
        type: 'security',
        severity: 'medium',
        file: filename,
        message: 'Insecure HTTP URLs detected',
        suggestion: 'Use HTTPS URLs to ensure secure communication',
      });
    }
  }

  return issues;
}
