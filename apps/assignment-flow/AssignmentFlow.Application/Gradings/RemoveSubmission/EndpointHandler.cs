using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.RemoveSubmission;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapRemoveSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapDelete("/{grading:required}/submissions/{reference:required}", UploadSubmission)
            .WithName("RemoveSubmission")
            .Produces<string>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        [FromRoute] string grading,
        [FromRoute] string reference,
        ICommandBus commandBus,
        GradingRepository gradingRepository,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(grading);
        var submissionReference = SubmissionReference.New(reference);

        await commandBus.PublishAsync(
            new Command(gradingId, submissionReference),
            cancellationToken);

        return TypedResults.Ok();
    }
}
