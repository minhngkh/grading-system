using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Submissions.Upload;

public class Command(SubmissionId aggregateId) : Command<SubmissionAggregate, SubmissionId>(aggregateId)
{
    public required string StudentId { get; init; }
    public required string AssignmentId { get; init; }
    public required IFormFile File { get; init; }
}

public class CommandHandler(
    BlobServiceClient client) : CommandHandler<SubmissionAggregate, SubmissionId, Command>
{
    public override async Task ExecuteAsync(SubmissionAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return ;

        var container = client.GetBlobContainerClient("submissions-store");
        var blob = container.GetBlobClient($"{command.AggregateId.Value}/{command.File.FileName}");

        using var stream = command.File.OpenReadStream();
        await blob.UploadAsync(stream, new BlobUploadOptions(), cancellationToken);

        //aggregate.Create(command);
    }
}