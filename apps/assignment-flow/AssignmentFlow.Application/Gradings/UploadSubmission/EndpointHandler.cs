using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{gradingId}", UploadSubmission)
            .WithName("UploadSubmission")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        [FromRoute] string gradingId,
        [FromForm] IFormFile file, //zip only
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        

        await commandBus.PublishAsync(
            new Command(GradingId.With(gradingId))
            {
                File = file
            }, cancellationToken);

        return TypedResults.Created();
    }
}
