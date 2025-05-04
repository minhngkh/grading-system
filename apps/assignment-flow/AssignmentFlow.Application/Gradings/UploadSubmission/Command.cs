using System.IO.Compression;
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
    public override async Task ExecuteAsync(GradingAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return;
        
        var container = client.GetBlobContainerClient("submissions-store");

        await using var stream = command.File.OpenReadStream();
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
        var rootDir = archive.Entries[0].FullName;

        var blobEntries = new List<string>();
        var globalPattern = aggregate.GetGlobalPattern();
        var relevantEntries = archive.Entries
            .Where(e => globalPattern.Match(rootDir, e.FullName));
        foreach (var entry in relevantEntries)
        {
            var blobName = $"{aggregate.Id}/{entry.FullName}";
            var blob = container.GetBlobClient(blobName);
            
            await blob.UploadAsync(entry.Open(), new BlobUploadOptions(), cancellationToken);

            blobEntries.Add(entry.FullName);
        }
        
        var submission = Submission.New(
            SubmissionReference.New(command.File.FileName),
            CriterionFilesSet(aggregate, rootDir, blobEntries));
        aggregate.AddSubmission(submission);
    }

    private static HashSet<CriterionFiles> CriterionFilesSet(GradingAggregate aggregate, string rootDir, List<string> blobEntries)
    {
        var criteriaFiles = new HashSet<CriterionFiles>();
        foreach (var selector in aggregate.GetCriterionAttachmentsSelectors())
        {
            criteriaFiles.Add(
                CriterionFiles.New(
                    CriterionName.New(selector.Criterion), 
                    [.. blobEntries
                        .Where(blob => selector.Pattern.Match(rootDir, blob))
                        .Select(Attachment.New)]));
        }

        return criteriaFiles;
    }
}