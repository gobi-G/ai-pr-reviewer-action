import { ChangedFile } from '../github';
import type { Issue } from './types';

export function analyzeAccessibility(file: ChangedFile): Issue[] {
  const issues: Issue[] = [];
  const { filename, contents } = file;

  if (!contents) return issues;

  // Check for images without alt text
  const imgWithoutAlt = /<img(?![^>]*alt=)[^>]*>/gi;
  const imgMatches = contents.match(imgWithoutAlt);
  if (imgMatches) {
    issues.push({
      type: 'accessibility',
      severity: 'medium',
      file: filename,
      message: `Found ${imgMatches.length} img tag(s) without alt attribute`,
      suggestion: 'Add descriptive alt text to all images for screen readers',
    });
  }

  // Check for form inputs without labels
  const inputWithoutLabel = /<input(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*>/gi;
  const inputMatches = contents.match(inputWithoutLabel);
  if (inputMatches) {
    issues.push({
      type: 'accessibility',
      severity: 'medium',
      file: filename,
      message: `Found ${inputMatches.length} input(s) without proper labeling`,
      suggestion: 'Ensure all form inputs have associated labels or aria-label attributes',
    });
  }

  // Check for missing heading hierarchy
  const headingRegex = /<h([1-6])[^>]*>/gi;
  const headings: number[] = [];
  let match;
  while ((match = headingRegex.exec(contents)) !== null) {
    headings.push(parseInt(match[1]!));
  }

  for (let i = 1; i < headings.length; i++) {
    const current = headings[i]!;
    const previous = headings[i - 1]!;
    if (current - previous > 1) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        file: filename,
        message: 'Heading hierarchy skips levels',
        suggestion: 'Use sequential heading levels (h1, h2, h3) for proper document structure',
      });
      break;
    }
  }

  // Check for unsafe innerHTML usage
  const unsafeInnerHTML = /\.innerHTML\s*=|dangerouslySetInnerHTML/gi;
  if (unsafeInnerHTML.test(contents)) {
    issues.push({
      type: 'accessibility',
      severity: 'medium',
      file: filename,
      message: 'Potentially unsafe innerHTML usage detected',
      suggestion: 'Consider using textContent or proper sanitization to prevent XSS',
    });
  }

  return issues;
}
