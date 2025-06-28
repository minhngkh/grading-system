using Azure.Storage.Blobs;
using EventFlow.Commands;

namespace RubricEngine.Application.Rubrics.RemoveAttachment;

public class Command(RubricId aggregateId, string reference) : Command<RubricAggregate, RubricId>(aggregateId)
{
    public string Reference { get; } = reference;
}

public class CommandHandler(BlobServiceClient client) : CommandHandler<RubricAggregate, RubricId, Command>
{
    public override async Task ExecuteAsync(RubricAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            throw new InvalidOperationException(
                $"Cannot remove submission for grading {aggregate.Id} because it has not been created yet.");

        var container = client.GetBlobContainerClient("rubric-context-store");
        try
        {
            BlobClient blobClient = container.GetBlobClient($"{aggregate.Id}/{command.Reference}");
            await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);

            aggregate.RemoveAttachment(command.Reference);
        }
        catch (Exception ex)
        {
            // Handle exceptions from the blob storage operations
            throw new InvalidOperationException(
                $"Failed to remove attachment {command.Reference} for rubric {aggregate.Id}", ex);
        }
    }
}
