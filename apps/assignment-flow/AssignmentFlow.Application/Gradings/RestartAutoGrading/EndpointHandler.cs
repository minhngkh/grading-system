using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.RestartAutoGrading;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapRestartAutoGrading(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}/restart", RestartAutoGrading)
            .WithName("RestartAutoGrading")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    //[Authorize]
    private static async Task<IResult> RestartAutoGrading(
        [FromRoute] string id,
        ICommandBus commandBus,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        await commandBus.PublishAsync(new Command(gradingId), cancellationToken);

        return TypedResults.NoContent();
    }
}
