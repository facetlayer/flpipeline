export type Severity = 'info' | 'low' | 'medium' | 'high';

export interface SourceLocation {
  filePath: string;
  line: number;
  column: number;
}

export interface Issue {
  severity: Severity;
  description: string;
  sourceLocation: SourceLocation;
}

export interface TestCaseRating {
  name: string;
  issues: Issue[];
}

export interface TestEvaluationResult {
  testCaseRatings: TestCaseRating[];
}
