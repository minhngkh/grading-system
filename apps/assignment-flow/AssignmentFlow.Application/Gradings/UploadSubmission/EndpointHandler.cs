using EventFlow;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id:required}/submissions", UploadSubmission)
            .WithName("UploadSubmission")
            .Produces<List<string>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    //[Authorize]
    private static async Task<IResult> UploadSubmission(
        [FromRoute] string id,
        [FromForm] IFormFileCollection files,
        ICommandBus commandBus,
        ISubmissionUploadService submissionUploadService,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        var submissions = await submissionUploadService.ExtractSubmissions(files, cancellationToken);

        await commandBus.PublishAsync(
            new Command(gradingId, submissions),
            cancellationToken);

        return TypedResults.Ok(submissions.ConvertAll(s => s.submissionReference));
    }
}
