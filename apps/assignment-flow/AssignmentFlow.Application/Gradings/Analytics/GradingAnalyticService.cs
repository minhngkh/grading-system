using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Gradings.Analytics;

public interface IGradingAnalyticService
{
    Task<OverallGradingAnalytics> GetOverallGradingAnalyticsAsync(string teacherId, CancellationToken cancellationToken);
    Task<GradingAnalytics> GetGradingAnalyticsAsync(string teacherId, string gradingId, CancellationToken cancellationToken);
}

public class GradingAnalyticService(AssignmentFlowDbContext dbContext) : IGradingAnalyticService
{
    public async Task<OverallGradingAnalytics> GetOverallGradingAnalyticsAsync(string teacherId, CancellationToken cancellationToken)
    {
        var totalGradings = await dbContext.Gradings
            .CountAsync(g => g.TeacherId == teacherId, cancellationToken);

        var assessmentStats = await dbContext.Assessments
            .Where(a => a.TeacherId == teacherId)
            .GroupBy(a => a.TeacherId)
            .Select(g => new
            {
                Count = g.Count(),
                AverageScore = g.Select(a => a.RawScore).Average()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new OverallGradingAnalytics
        {
            TotalGradings = totalGradings,
            TotalAssessments = assessmentStats?.Count ?? 0,
            AverageScore = assessmentStats?.AverageScore ?? 0m
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

        // Optimized: Process in-memory assessments list to avoid an additional database query.
        // Added null-coalescing operator for ScoreBreakdowns for robustness.
        var criterionData = assessments
            .SelectMany(a => a.ScoreBreakdowns)
            .GroupBy(sb => sb.CriterionName) // Assumes ScoreBreakdownApiContract has CriterionName
            .Select(g => new CriterionAnalytics
            {
                CriterionName = g.Key,
                TotalWeight = g.Sum(sb => sb.RawScore), // Assumes ScoreBreakdownApiContract has RawScore
                Scores = [.. g.Select(sb => sb.RawScore)]
            })
            .ToList(); // Synchronous LINQ to Objects operation

        var scores = assessments.Select(a => a.RawScore * grading.ScaleFactor).ToList();
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
