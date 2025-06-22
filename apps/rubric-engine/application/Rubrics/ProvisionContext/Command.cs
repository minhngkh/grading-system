using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EventFlow.Commands;
using System.Runtime.CompilerServices;

namespace RubricEngine.Application.Rubrics.ProvisionContext;

public class Command(RubricId aggregateId) : Command<RubricAggregate, RubricId>(aggregateId)
{
    public required IFormFileCollection Attachments { get; init; }
    public required Dictionary<string, object>? Metadata { get; init; }
}

public class CommandHandler(BlobServiceClient client) : CommandHandler<RubricAggregate, RubricId, Command>
{
    public override async Task ExecuteAsync(RubricAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            throw new InvalidOperationException(
                $"Cannot provision context for rubric {aggregate.Id} because it has not been created yet.");

        var container = client.GetBlobContainerClient("rubric-context-store");
        var blobEntries = await ProcessAttachments(aggregate, command, container, cancellationToken)
            .ToListAsync(cancellationToken: cancellationToken);

        aggregate.ProvisionContext(blobEntries, command.Metadata);
    }

    private static async IAsyncEnumerable<string> ProcessAttachments(
        RubricAggregate aggregate,
        Command command,
        BlobContainerClient container,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var baseBlobName = $"{aggregate.Id}/";

        foreach (var attachment in command.Attachments)
        {
            await using var stream = attachment.OpenReadStream();
            var blobName = baseBlobName + attachment.FileName;
            var blob = container.GetBlobClient(blobName);
            await blob.UploadAsync(stream, new BlobUploadOptions(), cancellationToken);

            yield return blobName;
        }
    }
}
