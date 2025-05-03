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
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        var criteriaFiles = new HashSet<CriterionFiles>();
        foreach (var mapping in aggregate.GetCriterionAttachmentsSelectors())
        {
            //TODO: Create Factory service for creating this mapping, which supports multiple strategies
            criteriaFiles.Add(
                CriterionFiles.New(
                    CriterionName.New(mapping.Criterion), 
                [.. command.BlobEntries
                        .Where(uri => uri.AbsoluteUri.Contains(mapping.ContentSelector.Pattern))
                        .Select(x => Attachment.New(x.AbsoluteUri))]));
        }

        var submission = Submission.New(command.Reference, criteriaFiles);
        aggregate.AddSubmission(submission);

        return Task.CompletedTask;
    }
}