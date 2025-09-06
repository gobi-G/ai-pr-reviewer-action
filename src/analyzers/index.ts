import { analyzeAccessibility } from './a11y';
import { analyzePerformance } from './perf';
import { analyzeSecurity } from './security';
import { ChangedFile } from '../github';
import type { Issue } from './types';

// Re-export the Issue type for convenience
export type { Issue } from './types';

export async function runAnalyzers(files: ChangedFile[]): Promise<Issue[]> {
  const issues: Issue[] = [];

  for (const file of files) {
    if (!file.contents) continue;

    // Run all analyzers
    issues.push(...analyzeAccessibility(file));
    issues.push(...analyzePerformance(file));
    issues.push(...analyzeSecurity(file));
  }

  return issues;
}
