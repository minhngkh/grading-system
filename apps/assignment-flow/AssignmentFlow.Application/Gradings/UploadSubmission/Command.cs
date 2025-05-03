using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public class Command(GradingId aggregateId) : Command<GradingAggregate, GradingId>(aggregateId)
{
    public required SubmissionReference Reference { get; init; }
    public required List<Uri> BlobEntries { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        var criteriaFiles = new HashSet<CriterionFiles>();
        foreach (var selector in aggregate.GetCriterionAttachmentsSelectors())
        {
            var attachments = new List<Attachment>();
            criteriaFiles.Add(
                CriterionFiles.New(
                    CriterionName.New(selector.Criterion), 
                    [.. command.BlobEntries
                        .Where(uri => selector.Pattern.Contains(uri.AbsoluteUri))
                        .Select(x => Attachment.New(x.AbsoluteUri))]));
        }

        var submission = Submission.New(command.Reference, criteriaFiles);
        aggregate.AddSubmission(submission);

        return Task.CompletedTask;
    }
}