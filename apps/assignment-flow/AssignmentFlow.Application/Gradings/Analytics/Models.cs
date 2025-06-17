namespace AssignmentFlow.Application.Gradings.Analytics;

public class OverallGradingAnalytics
{
    public required int TotalGradings { get; init; }
    public required int TotalAssessments { get; init; }
    public required decimal AverageScore { get; init; }
}

public class GradingAnalytics
{
    public required string GradingId { get; init; }

    public required decimal ScaleFactor { get; init; }

    public required decimal AverageScore { get; init; }

    public required int AssessmentCount { get; init; }

    public required List<decimal> Scores { get; init; }

    public required List<CriterionAnalytics> CriterionData { get; init; }
}

public class CriterionAnalytics
{
    public required string CriterionName { get; init; }
    public required decimal TotalWeight { get; init; }
    public required List<decimal> Scores { get; init; }
}
