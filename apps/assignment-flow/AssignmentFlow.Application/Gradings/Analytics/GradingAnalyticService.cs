using Microsoft.EntityFrameworkCore;
using RubricEngine.Application.Protos;

namespace AssignmentFlow.Application.Gradings.Analytics;

public interface IGradingAnalyticService
{
    Task<OverallGradingAnalytics> GetOverallGradingAnalyticsAsync(string teacherId, CancellationToken cancellationToken);
    Task<GradingAnalytics> GetGradingAnalyticsAsync(string teacherId, string gradingId, CancellationToken cancellationToken);
}

public class GradingAnalyticService(
    RubricProtoService.RubricProtoServiceClient rubricProtoService,
    AssignmentFlowDbContext dbContext) : IGradingAnalyticService
{
    public async Task<OverallGradingAnalytics> GetOverallGradingAnalyticsAsync(string teacherId, CancellationToken cancellationToken)
    {
        var totalGradings = await dbContext.Gradings
            .CountAsync(g => g.TeacherId == teacherId, cancellationToken);

        var assessmentScores = await dbContext.Assessments
            .Where(a => a.TeacherId == teacherId)
            .Select(a => a.RawScore)
            .ToListAsync(cancellationToken);

        return new OverallGradingAnalytics
        {
            TotalGradings = totalGradings,
            TotalAssessments = assessmentScores?.Count ?? 0,
            AverageScore = assessmentScores?.Average() ?? 0m,
            Scores = assessmentScores ?? []
        };
    }

    public async Task<GradingAnalytics> GetGradingAnalyticsAsync(string teacherId, string gradingId, CancellationToken cancellationToken)
    {
        var grading = await dbContext.Gradings
            .Where(g => g.TeacherId == teacherId && g.Id == gradingId)
            .SingleAsync(cancellationToken);

        var assessments = await dbContext.Assessments
            .Where(a => a.GradingId == gradingId)
            .ToListAsync(cancellationToken);

        var rubric = await rubricProtoService.GetRubricAsync(new GetRubricRequest
        {
            RubricId = grading.RubricId
        }, cancellationToken: cancellationToken);

        // Pre-compute criterion weights for O(1) lookup performance
        var criterionWeights = rubric.Criteria
            .ToDictionary(c => c.Name, c => (decimal)c.Weight);

        var criterionData = assessments
            .SelectMany(a => a.ScoreBreakdowns ?? [])
            .GroupBy(sb => sb.CriterionName)
            .Select(g => new CriterionAnalytics
            {
                CriterionName = g.Key,
                TotalWeight = criterionWeights.TryGetValue(g.Key, out var weight) ? weight : 0m,
                Scores = [.. g.Select(sb => sb.RawScore)]
            })
            .ToList(); // Synchronous LINQ to Objects operation

        var scores = assessments.Select(a => a.RawScore).ToList();
        var averageScore = scores.Count != 0 ? scores.Average() : 0m;
        var scaleFactor = grading.ScaleFactor;

        return new GradingAnalytics
        {
            GradingId = grading.Id,
            ScaleFactor = scaleFactor,
            AverageScore = averageScore,
            AssessmentCount = assessments.Count,
            Scores = scores,
            CriterionData = criterionData
        };
    }
}
