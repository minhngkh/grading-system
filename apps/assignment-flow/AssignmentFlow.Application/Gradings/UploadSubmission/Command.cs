using System.IO.Compression;
using System.Reflection.Metadata;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public class Command(GradingId aggregateId) : Command<GradingAggregate, GradingId>(aggregateId)
{
    public required IFormFile File { get; init; }
}

public class CommandHandler(
    BlobServiceClient client) : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override async Task ExecuteAsync(GradingAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return ;

        var container = client.GetBlobContainerClient("submissions-store");

        using var stream = command.File.OpenReadStream();
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read);

        var blobEntries = new List<Uri>();
        foreach (var entry in archive.Entries)
        {
            var blobName = $"{command.AggregateId.Value}/{entry.FullName}";
            var blob = container.GetBlobClient(blobName);
            await blob.UploadAsync(entry.Open(), new BlobUploadOptions(), cancellationToken);

            blobEntries.Add(blob.Uri);
        }

        aggregate.AddSubmission(blobEntries);
    }
}