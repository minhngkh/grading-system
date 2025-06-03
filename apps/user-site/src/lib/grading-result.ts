import { Assessment } from "@/types/assessment";

export default class GradingResultHelper {
  constructor(
    private assessments: Assessment[],
    private scaleFactor: number,
  ) {}

  getAverageScore(): number {
    if (this.assessments.length === 0) return 0;
    const totalScore = this.assessments.reduce(
      (sum, item) => sum + (item.rawScore * this.scaleFactor) / 100,
      0,
    );
    return totalScore / this.assessments.length;
  }

  getHighestScore(): number {
    if (this.assessments.length === 0) return 0;
    return Math.max(
      ...this.assessments.map((item) => (item.rawScore * this.scaleFactor) / 100),
    );
  }

  getLowestScore(): number {
    if (this.assessments.length === 0) return 0;
    return Math.min(
      ...this.assessments.map((item) => (item.rawScore * this.scaleFactor) / 100),
    );
  }
}
