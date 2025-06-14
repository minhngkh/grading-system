using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UpdateScaleFactor;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUpdateScaleFactor(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPut("/{id}/scaleFactor", UpdateScaleFactor)
            .WithName("UpdateScaleFactor")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> UpdateScaleFactor(
        [FromRoute] string id,
        [FromBody] UpdateScaleFactorRequest request,
        ICommandBus commandBus,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        await commandBus.PublishAsync(new Command(gradingId)
        {
            ScaleFactor = ScaleFactor.New(request.ScaleFactor)
        }, cancellationToken);

        return TypedResults.Ok();
    }
}
