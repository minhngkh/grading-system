using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.RemoveSubmission;

public class Command(GradingId aggregateId, SubmissionReference submissionReference) : Command<GradingAggregate, GradingId>(aggregateId)
{
    public SubmissionReference SubmissionReference { get; } = submissionReference;
}

public class CommandHandler(BlobServiceClient client) : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override async Task ExecuteAsync(GradingAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            throw new InvalidOperationException(
                $"Cannot remove submission for grading {aggregate.Id} because it has not been created yet.");

        var container = client.GetBlobContainerClient("submissions-store");
        var submissionFolderPath = $"{aggregate.Id}/{command.SubmissionReference}";
        try
        {
            var blobItems = container.GetBlobsAsync(
                prefix: submissionFolderPath,
                cancellationToken: cancellationToken);

            await foreach (BlobItem blobItem in blobItems)
            {
                BlobClient blobClient = container.GetBlobClient(blobItem.Name);
                await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
            }

            aggregate.RemoveSubmission(command);
        }
        catch (Exception ex)
        {
            // Handle exceptions from the blob storage operations
            throw new InvalidOperationException(
                $"Failed to remove submission {command.SubmissionReference} for grading {aggregate.Id}", ex);
        }
    }
}
