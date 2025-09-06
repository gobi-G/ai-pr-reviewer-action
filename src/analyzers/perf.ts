import { ChangedFile } from '../github';
import type { Issue } from './types';

export function analyzePerformance(file: ChangedFile): Issue[] {
  const issues: Issue[] = [];
  const { filename, contents } = file;

  if (!contents) return issues;

  // Check for large bundle imports
  const heavyLibraryImports = /import.*(?:lodash|moment|jquery)(?![\/\w])/gi;
  const heavyImports = contents.match(heavyLibraryImports);
  if (heavyImports) {
    issues.push({
      type: 'performance',
      severity: 'medium',
      file: filename,
      message: `Importing heavy libraries: ${heavyImports.join(', ')}`,
      suggestion: 'Consider using lighter alternatives or importing only needed functions',
    });
  }

  // Check for synchronous operations that could block
  const syncOperations =
    /localStorage\.getItem|sessionStorage\.getItem|document\.write|alert\(|confirm\(|prompt\(/gi;
  const syncMatches = contents.match(syncOperations);
  if (syncMatches) {
    issues.push({
      type: 'performance',
      severity: 'low',
      file: filename,
      message: `Found potentially blocking synchronous operations: ${syncMatches.slice(0, 3).join(', ')}`,
      suggestion: 'Consider using asynchronous alternatives where possible',
    });
  }

  // Check for inefficient DOM queries
  const inefficientQueries =
    /document\.getElementById|document\.getElementsBy|document\.querySelector(?!All)/gi;
  const queryMatches = contents.match(inefficientQueries);
  if (queryMatches && queryMatches.length > 5) {
    issues.push({
      type: 'performance',
      severity: 'low',
      file: filename,
      message: `Multiple DOM queries detected (${queryMatches.length})`,
      suggestion: 'Cache DOM references and consider using more efficient selectors',
    });
  }

  // Check for missing image optimization hints
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
    const imgTags = /<img[^>]*src=[^>]*>/gi;
    const imgMatches = contents.match(imgTags);
    if (imgMatches) {
      const hasLoading = /loading=["']lazy["']/gi.test(contents);

      if (!hasLoading) {
        issues.push({
          type: 'performance',
          severity: 'low',
          file: filename,
          message: 'Images without lazy loading detected',
          suggestion: 'Add loading="lazy" to images below the fold for better performance',
        });
      }
    }
  }

  return issues;
}
