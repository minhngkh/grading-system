export interface OverallGradingAnalytics {
  totalGradingCount: number;
  totalAssessmentCount: number;
  averageScore: number; // 0 to 1, or multiply by 100 for %
  gradingDistribution: number[]; // length === 10, representing 0–10%, 10–20%, ..., 90–100%
}

export interface CriterionScoreDistribution {
  criterionName: string;
  totalWeight: number;
  scoreDistribution: number[]; // length 10: 0-10%, ..., 90-100%
}

export interface GradingAnalytics {
  gradingId: string;
  scaleFactor: number;
  averageScore: number; // 0 to 1, or multiply by 100 if needed
  assessmentCount: number;
  scoreDistribution: number[]; // length 10: 0-10%, ..., 90-100%
  criterionData: CriterionScoreDistribution[];
}
