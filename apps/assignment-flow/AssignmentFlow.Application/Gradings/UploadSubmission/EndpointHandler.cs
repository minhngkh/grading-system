using Azure.Storage.Blobs.Models;
using System.IO.Compression;
using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;
using Azure.Storage.Blobs;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}/submissions", UploadSubmission)
            .WithName("UploadSubmission")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        [FromRoute] string id,
        [FromForm] IFormFile file, //zip only
        [FromServices] BlobServiceClient client,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        var container = client.GetBlobContainerClient("submissions-store");

        using var stream = file.OpenReadStream();
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read);

        var blobEntries = new List<Uri>();
        foreach (var entry in archive.Entries)
        {
            var blobName = $"{gradingId}/{entry.FullName}";
            var blob = container.GetBlobClient(blobName);
            await blob.UploadAsync(entry.Open(), new BlobUploadOptions(), cancellationToken);

            blobEntries.Add(blob.Uri);
        } 

        var reference = SubmissionReference.New(file.Name);

        await commandBus.PublishAsync(
            new Command(gradingId)
            {
                Reference = reference,
                BlobEntries = blobEntries,
            }, cancellationToken);

        return TypedResults.Created();
    }
}
