using Azure.Storage.Blobs;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Submissions.Upload;

public class Command(SubmissionId aggregateId) : Command<SubmissionAggregate, SubmissionId>(aggregateId)
{
    //TODO: Define necessary properties for the command
}

public class CommandHandler(
    BlobServiceClient client) : CommandHandler<SubmissionAggregate, SubmissionId, Command>
{
    public override Task ExecuteAsync(SubmissionAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        //aggregate.Create(command);

        return Task.CompletedTask;
    }
}