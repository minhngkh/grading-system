using System.IO.Compression;
using System.Runtime.CompilerServices;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public class Command(GradingId aggregateId) : Command<GradingAggregate, GradingId>(aggregateId)
{
    public required IFormFile File { get; init; }
}

public class CommandHandler(BlobServiceClient client) : CommandHandler<GradingAggregate, GradingId, Command>
{
    private static readonly string[] SupportedZipMimeTypes = ["application/zip", "application/x-zip-compressed"];

    public override async Task ExecuteAsync(GradingAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return;

        var container = client.GetBlobContainerClient("submissions-store");

        var blobEntries = await ProcessAttachments(aggregate, command, container, cancellationToken)
            .ToListAsync(cancellationToken: cancellationToken);

        var studentId = ExtractStudentId(command.File.FileName);

        var submission = Submission.New(
            SubmissionReference.New($"{aggregate.Id}_{studentId}"),
            blobEntries);
        aggregate.AddSubmission(submission);
    }

    /// <summary>
    /// Extracts the student ID from a filename.
    /// </summary>
    /// <param name="fileName">The filename in format "student_id.*" where everything before the first period is the student ID.</param>
    /// <returns>The extracted student ID, or the entire filename if no extension is present.</returns>
    private static string ExtractStudentId(string fileName)
    {
        // If filename contains a period, extract everything before it
        // This handles cases like "student_id.zip" or "student_id.pdf"
        var dotIndex = fileName.IndexOf('.');
        if (dotIndex > 0)
        {
            return fileName[..dotIndex];
        }

        // If no extension, use the whole filename
        return fileName;
    }

    private static async IAsyncEnumerable<Attachment> ProcessAttachments(
        GradingAggregate aggregate,
        Command command,
        BlobContainerClient container,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (!SupportedZipMimeTypes.Contains(command.File.ContentType))
        {
            // Handle single file upload
            await using var stream = command.File.OpenReadStream();
            var blobName = $"{aggregate.Id}/{command.File.FileName}";
            var blob = container.GetBlobClient(blobName);
            await blob.UploadAsync(stream, new BlobUploadOptions(), cancellationToken);

            yield return Attachment.New(blob.Uri.AbsoluteUri);
        }
        else
        {
            // Handle zip file upload
            await using var stream = command.File.OpenReadStream();
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            var rootDir = archive.Entries.Count > 0 ? archive.Entries[0].FullName : string.Empty;

            foreach (var entry in archive.Entries)
            {
                var blobName = $"{aggregate.Id}/{entry.FullName}";
                var blob = container.GetBlobClient(blobName);

                await using var entryStream = entry.Open();
                await blob.UploadAsync(entryStream, new BlobUploadOptions(), cancellationToken);

                yield return Attachment.New(blob.Uri.AbsoluteUri);
            }
        }
    }
}
