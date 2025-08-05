export interface OverallGradingAnalytics {
  totalGradings: number;
  totalAssessments: number;
  averageScore: number;
  scores: number[];
}

export interface CriterionScoreDistribution {
  criterionName: string;
  totalWeight: number;
  scores: number[];
}

export interface GradingAnalytics {
  gradingId: string;
  scaleFactor: number;
  averageScore: number;
  assessmentCount: number;
  scores: number[];
  criterionData: CriterionScoreDistribution[];
}
