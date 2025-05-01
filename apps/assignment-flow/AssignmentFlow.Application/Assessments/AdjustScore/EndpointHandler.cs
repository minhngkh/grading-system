using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Assessments.AdjustScore;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapAdjustScore(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}/adjustments", AdjustScore)
            .WithName("AdjustScore")
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> AdjustScore(
        [FromBody] AdjustScoreRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var teacherId = TeacherId.New("teacher");

        return TypedResults.Accepted(uri: "");
    }
}
