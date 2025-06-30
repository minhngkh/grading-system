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
        var grading = await dbContext.Gradings
            .AsNoTracking()
            .Where(g => g.Id == gradingId)
            .Select(g => new
            {
                Selectors = g.Selectors,
                Submission = g.SubmissionPersistences.SingleOrDefault(s => s.Reference == submissionReference)
            })
            .SingleOrDefaultAsync(cancellationToken);

        ArgumentNullException.ThrowIfNull(grading?.Submission);

        return new SubmissionApiContract
        {
            Reference = grading.Submission.Reference,
            CriteriaFiles = grading.Selectors.ConvertAll(selector => new CriterionFilesApiContract
            {
                Criterion = selector.Criterion,
                Files = [.. grading.Submission.Attachments.Where(attachment => {
                    //"<submission-reference>/**"
                    return Pattern.New(selector.Pattern).Match($"{grading.Submission.Reference}/", attachment);
                })]
            })
        };
    }
}

public sealed class GradingSummary
{
    public required string Id { get; set; }
    public required string RubricId { get; set; }
    public required string TeacherId { get; set; }
    public List<SubmissionApiContract> Submissions { get; set; } = [];
}
