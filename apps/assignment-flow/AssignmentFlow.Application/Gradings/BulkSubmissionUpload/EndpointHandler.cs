using EventFlow;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

namespace AssignmentFlow.Application.Gradings.BulkSubmissionUpload;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapBulkUploadSubmissions(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id:required}/submissions/bulk-upload", BulkUploadSubmissions)
            .WithName("BulkUploadSubmissions")
            .Produces<List<string>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    //[Authorize]
    private static async Task<IResult> BulkUploadSubmissions(
        [FromRoute] string id,
        [FromForm] IFormFile zipFile,
        ICommandBus commandBus,
        ISubmissionUploadService submissionUploadService,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        await submissionUploadService.Validate(zipFile);

        using var archive = new ZipArchive(zipFile.OpenReadStream(), ZipArchiveMode.Read);
        var submissions = await submissionUploadService.ExtractSubmissions(archive, cancellationToken);

        await commandBus.PublishAsync(
            new Command(gradingId, submissions),
            cancellationToken);

        return TypedResults.Ok(submissions.ConvertAll(s => s.submissionReference));
    }
}
