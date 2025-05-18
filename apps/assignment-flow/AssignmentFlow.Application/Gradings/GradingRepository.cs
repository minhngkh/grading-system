using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Gradings;

public sealed class GradingRepository(AssignmentFlowDbContext dbContext)
{
    public async Task<GradingSummary> GetGradingSummary(string id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Gradings
            .AsNoTracking()
            .Where(grading => grading.Id == id)
            .Select(grading => new GradingSummary
            {
                Id = grading.Id,
                RubricId = grading.RubricId,
                TeacherId = grading.TeacherId,
                Submissions = grading.Submissions
            })
            .FirstAsync(cancellationToken);
    }

    public async Task<SubmissionApiContract> GetSubmissionAsync(string gradingId, string submissionReference, CancellationToken cancellationToken = default)
    {
        return await dbContext.Gradings
            .AsNoTracking()
            .Where(grading => grading.Id == gradingId)
            .SelectMany(grading => grading.Submissions
                .Where(submission => submission.Reference == submissionReference))
            .FirstAsync(cancellationToken);
    }
}

public sealed class GradingSummary
{
    public required string Id { get; set; }
    public required string RubricId { get; set; }
    public required string TeacherId { get; set; }
    public List<SubmissionApiContract> Submissions { get; set; } = [];
}
