using EventFlow;

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
            Criteria = request.Criteria?.ToCriteria()
        };

        await commandBus.PublishAsync(command, cancellationToken);

        return TypedResults.Ok();
    }
}
