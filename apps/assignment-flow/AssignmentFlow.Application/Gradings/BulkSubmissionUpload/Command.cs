using EventFlow.Commands;
using System.IO.Compression;

namespace AssignmentFlow.Application.Gradings.BulkSubmissionUpload;

public class Command(GradingId id, List<(SubmissionReference submissionReference, ZipArchiveEntry entry)> submissions) : Command<GradingAggregate, GradingId>(id)
{
    public List<(SubmissionReference submissionReference, ZipArchiveEntry entry)> Submissions { get; init; } = submissions;
}

public class CommandHandler(ISubmissionUploadService uploadService) : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override async Task ExecuteAsync(
        GradingAggregate aggregate,
        Command command,
        CancellationToken cancellationToken)
    {
        if(aggregate.IsNew)
        {
            return;
        }

        var submissions = await uploadService
            .ProcessSubmissions(aggregate.Id, command.Submissions, cancellationToken);

        aggregate.AddSubmissions(submissions);
    }
}
