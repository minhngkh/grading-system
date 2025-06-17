using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.Start;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapStartGrading(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}/start", StartGrading)
            .WithName("StartGrading")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> StartGrading(
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
