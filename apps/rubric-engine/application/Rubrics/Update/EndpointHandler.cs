using EventFlow;
using Microsoft.AspNetCore.Authorization;

namespace RubricEngine.Application.Rubrics.Update;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUpdateRubric(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPatch("/{rubricId}", UpdateRubricHandler)
            .WithName("UpdateRubric")
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> UpdateRubricHandler(
        string rubricId,
        UpdateRubricRequest request,
        ICommandBus commandBus,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var command = new Command(RubricId.With(rubricId))
        {
            Name = request.RubricName?.ToRubricName(),
            PerformanceTags = request.Tags?.ToPerformanceTags(),
            Criteria = request.Criteria?.ToCriteria(),
            Metadata = request.Metadata
        };

        await commandBus.PublishAsync(command, cancellationToken);

        return TypedResults.Ok();
    }
}
