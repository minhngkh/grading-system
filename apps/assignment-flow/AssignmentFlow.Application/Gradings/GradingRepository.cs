using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Gradings;

public sealed class GradingRepository(AssignmentFlowDbContext dbContext)
{
    public async Task<GradingSummary> GetGradingSummary(string id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Set<Grading>()
            .AsNoTracking()
            .Where(grading => grading.Id == id)
            .Select(grading => new GradingSummary
            {
                Id = grading.Id,
                RubricId = grading.RubricId,
                Submissions = grading.Submissions
            })
            .FirstAsync(cancellationToken);
    }
}

public sealed class GradingSummary
{
    public required string Id { get; set; }
    public required string RubricId { get; set; }
    public List<SubmissionApiContract> Submissions { get; set; } = [];
}
