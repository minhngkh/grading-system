﻿using System.IO.Compression;
using System.Runtime.CompilerServices;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public class Command(GradingId aggregateId) : Command<GradingAggregate, GradingId>(aggregateId)
{
    public required SubmissionReference SubmissionReference { get; init; }
    public required IFormFile File { get; init; }
}

public class CommandHandler(BlobServiceClient client) : CommandHandler<GradingAggregate, GradingId, Command>
{
    private static readonly string[] SupportedZipMimeTypes = ["application/zip", "application/x-zip-compressed"];

    public override async Task ExecuteAsync(GradingAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            throw new InvalidOperationException(
                $"Cannot upload submission for grading {aggregate.Id} because it has not been created yet.");

        var container = client.GetBlobContainerClient("submissions-store");

        var blobEntries = await ProcessAttachments(aggregate, command, container, cancellationToken)
            .ToListAsync(cancellationToken: cancellationToken);

        var submission = Submission.New(
            command.SubmissionReference,
            blobEntries);
        aggregate.AddSubmission(submission);
    }

    private static async IAsyncEnumerable<Attachment> ProcessAttachments(
        GradingAggregate aggregate,
        Command command,
        BlobContainerClient container,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var baseBlobName = $"{aggregate.Id}/{command.SubmissionReference}/";

        if (!SupportedZipMimeTypes.Contains(command.File.ContentType))
        {
            // Handle single file upload
            await using var stream = command.File.OpenReadStream();
            var blobName = baseBlobName + command.File.FileName;
            var blob = container.GetBlobClient(blobName);
            await blob.UploadAsync(stream, new BlobUploadOptions(), cancellationToken);

            yield return Attachment.New(blob.Uri.AbsoluteUri);
        }
        else
        {
            // Handle zip file upload
            await using var stream = command.File.OpenReadStream();
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            
            // Check if the archive is empty
            if (archive.Entries.Count == 0)
            {
                throw new InvalidOperationException("The uploaded zip file is empty.");
            }

            foreach (var entry in archive.Entries)
            {
                // Skip directory entries
                if (string.IsNullOrEmpty(entry.Name) || entry.FullName.EndsWith("/"))
                {
                    continue;
                }

                var blobName = baseBlobName + entry.FullName;
                var blob = container.GetBlobClient(blobName);

                await using var entryStream = entry.Open();
                await blob.UploadAsync(entryStream, new BlobUploadOptions(), cancellationToken);

                yield return Attachment.New(blob.Uri.AbsoluteUri);
            }
        }
    }
}
