using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.StaticFiles;
using System.IO.Compression;
using System.Runtime.CompilerServices;

namespace AssignmentFlow.Application.Gradings;

public interface ISubmissionUploadService
{
    /// <summary>
    /// Extracts submissions from a collection of files. Each file is treated as a separate submission.
    /// </summary>
    Task<List<(SubmissionReference submissionReference, IFormFile file)>> ExtractSubmissions(
        IFormFileCollection files,
        CancellationToken cancellationToken);
    Task<List<Submission>> ProcessSubmissions(
        GradingId gradingId,
        List<(SubmissionReference submissionReference, IFormFile file)> submissions,
        CancellationToken cancellationToken);

    /// <summary>
    /// Extracts submissions from a single zip file. Each entry in the zip is treated as a submission file.
    /// </summary>
    Task<List<(SubmissionReference submissionReference, ZipArchiveEntry entry)>> ExtractSubmissions(
        ZipArchive archive,
        CancellationToken cancellationToken);
    Task<List<Submission>> ProcessSubmissions(
        GradingId gradingId,
        List<(SubmissionReference submissionReference, ZipArchiveEntry entry)> submissions,
        CancellationToken cancellationToken);

    Task Validate(IFormFile file);
}

public class SubmissionUploadService(BlobServiceClient client) : ISubmissionUploadService
{
    private static readonly string[] SupportedZipMimeTypes =
    [
        "application/zip",
        "application/x-zip-compressed",
    ];

    public Task Validate(IFormFile file)
    {
        if (file.Length == 0)
        {
            throw new InvalidOperationException("The uploaded file is empty.");
        }
        if (!SupportedZipMimeTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Unsupported file type. Please upload a valid zip file.");
        }
        return Task.CompletedTask;
    }

    public Task<List<(SubmissionReference submissionReference, ZipArchiveEntry entry)>> ExtractSubmissions(ZipArchive archive, CancellationToken cancellationToken)
    {
        var submissionFiles = archive.Entries.Select(entry =>
        {
            var submissionReference = SubmissionReference.New(ExtractStudentId(entry.Name));
            return (submissionReference, entry);
        }).ToList();

        return Task.FromResult(submissionFiles);
    }

    public Task<List<(SubmissionReference submissionReference, IFormFile file)>> ExtractSubmissions(IFormFileCollection files, CancellationToken cancellationToken)
    {
        var submissionFiles = files.Select(file => (SubmissionReference.New(ExtractStudentId(file.FileName)), file))
                    .ToList<(SubmissionReference SubmissionReference, IFormFile file)>();
        return Task.FromResult(submissionFiles);
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
        var dotIndex = fileName.LastIndexOf('.');
        if (dotIndex > 0)
        {
            return fileName[..dotIndex];
        }

        // If no extension, use the whole filename
        return fileName;
    }

    public async Task<List<Submission>> ProcessSubmissions(
        GradingId gradingId,
        List<(SubmissionReference, ZipArchiveEntry)> submissions,
        CancellationToken cancellationToken)
    {
        var container = client.GetBlobContainerClient("submissions-store");

        var result = await Task.WhenAll(submissions.Select(async (submission) =>
        {
            var (submissionReference, entry) = submission;
            using var stream = entry.Open(); // Open the stream for the zip entry
            var blobEntries = await ProcessAttachments(
                baseBlobPath: $"{gradingId}/{submissionReference}/",
                fileName: entry.Name,
                contentType: "application/zip",
                fileStream: stream,
                container: container,
                cancellationToken
            ).ToListAsync(cancellationToken: cancellationToken);

            return Submission.New(submissionReference, blobEntries);
        }));

        return [.. result];
    }

    public async Task<List<Submission>> ProcessSubmissions(
        GradingId gradingId,
        List<(SubmissionReference, IFormFile)> submissions,
        CancellationToken cancellationToken)
    {
        var container = client.GetBlobContainerClient("submissions-store");

        var result = await Task.WhenAll(submissions.Select(async (submission) =>
        {
            var (submissionReference, file) = submission;
            using var stream = file.OpenReadStream(); // Open the stream for the file

            var blobEntries = await ProcessAttachments(
                baseBlobPath: $"{gradingId}/{submissionReference}/",
                fileName: file.FileName,
                contentType: file.ContentType,
                fileStream: stream,
                container: container,
                cancellationToken
            ).ToListAsync(cancellationToken: cancellationToken);

            return Submission.New(submissionReference, blobEntries);
        }));

        return [.. result];
    }
    
    private static async IAsyncEnumerable<Attachment> ProcessAttachments(
        string baseBlobPath,
        string fileName,
        string contentType,
        Stream fileStream,
        BlobContainerClient container,
        [EnumeratorCancellation] CancellationToken cancellationToken
    )
    {
        if (!SupportedZipMimeTypes.Contains(contentType))
        {
            // Single file upload
            var blobName = baseBlobPath + fileName;
            var blob = container.GetBlobClient(blobName);
            await blob.UploadAsync(fileStream, cancellationToken);

            yield return Attachment.New(fileName);
        }
        else
        {
            // Zip file upload
            using var archive = new ZipArchive(fileStream, ZipArchiveMode.Read);
            var provider = new FileExtensionContentTypeProvider();

            if (archive.Entries.Count == 0)
                throw new InvalidOperationException("The uploaded zip file is empty.");

            foreach (var entry in archive.Entries)
            {
                if (string.IsNullOrEmpty(entry.Name) || entry.FullName.EndsWith('/'))
                    continue;

                var blobName = baseBlobPath + entry.FullName;
                var blob = container.GetBlobClient(blobName);

                await using var entryStream = entry.Open();

                if (!provider.TryGetContentType(blobName, out var entryContentType))
                    entryContentType = "application/octet-stream";

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = entryContentType },
                };

                await blob.UploadAsync(entryStream, uploadOptions, cancellationToken);

                yield return Attachment.New(entry.FullName);
            }
        }
    }
}
