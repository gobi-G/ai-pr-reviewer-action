export interface Issue {
  type: 'accessibility' | 'performance' | 'security';
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}
