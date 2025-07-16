// Types for static_analysis plugin

export interface AnalysisFile {
  filename: string;
  content: string;
}

export interface AnalysisRequest {
  files: AnalysisFile[];
  rules?: string; // Optional: custom Semgrep rules (YAML string)
}

export interface SemgrepFinding {
  ruleId: string;
  message: string;
  path: string;
  startLine: number;
  endLine: number;
  severity: string;
  metadata?: Record<string, any>;
}

export interface FileAnalysisResult {
  filename: string;
  language: string;
  findings: SemgrepFinding[];
  score: number;
  error?: string;
}

export interface AnalysisResponse {
  results: FileAnalysisResult[];
  summary?: string;
  error?: string;
}
