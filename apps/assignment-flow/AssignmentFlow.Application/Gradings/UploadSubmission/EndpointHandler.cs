using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public static class EndpointHandler
{
    private static readonly string[] SupportedZipMimeTypes = ["application/zip", "application/x-zip-compressed"];

    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id:required}/submissions", UploadSubmission)
            .WithName("UploadSubmission")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        [FromRoute] string id,
        [FromForm] IFormFile file, //zip only
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        // Validate ContentType
        if (!SupportedZipMimeTypes.Contains(file.ContentType))
        {
            return TypedResults.BadRequest("Only ZIP files are allowed.");
        }

        var gradingId = GradingId.With(id);
        await commandBus.PublishAsync(
            new Command(gradingId)
            {
                File = file,
            }, cancellationToken);

        return TypedResults.Created();
    }
}
