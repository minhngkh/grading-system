export interface OverallGradingAnalytics {
  totalGradings: number;
  totalAssessments: number;
  averageScore: number;
  scores: number[];
}

export interface CriterionScoreDistribution {
  criterionName: string;
  totalWeight: number;
  scores: number[]; // length 10: 0-10%, ..., 90-100%
}

export interface GradingAnalytics {
  gradingId: string;
  scaleFactor: number;
  averageScore: number; // 0 to 1, or multiply by 100 if needed
  assessmentCount: number;
  scores: number[]; // length 10: 0-10%, ..., 90-100%
  criterionData: CriterionScoreDistribution[];
}
