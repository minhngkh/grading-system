using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public class Command(GradingId aggregateId, List<(SubmissionReference, IFormFile)> submissions)
    : Command<GradingAggregate, GradingId>(aggregateId)
{
    public List<(SubmissionReference, IFormFile)> Submissions { get; init; } = submissions;
}

public class CommandHandler(ISubmissionUploadService uploadService)
    : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override async Task ExecuteAsync(
        GradingAggregate aggregate,
        Command command,
        CancellationToken cancellationToken
    )
    {
        if (aggregate.IsNew)
            throw new InvalidOperationException(
                $"Cannot upload submission for grading {aggregate.Id} because it has not been created yet."
            );

        var submissions = await uploadService
            .ProcessSubmissions(aggregate.Id, command.Submissions, cancellationToken);

        aggregate.AddSubmissions(submissions);
    }
}
