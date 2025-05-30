import { Assessment } from "./assessment";
import { GradingAttempt } from "./grading";
import { Rubric } from "./rubric";

export interface AnalyticsData {
  assessments: {
    total: number;
    averageScore: number;
    scoreDistribution: { score: number; count: number }[];
    recentAssessments: Assessment[];
  };
  gradings: {
    total: number;
    statusDistribution: { status: string; count: number }[];
    recentGradings: GradingAttempt[];
  };
  rubrics: {
    total: number;
    mostUsed: Rubric[];
    criteriaDistribution: { criteria: string; count: number }[];
  };
}
