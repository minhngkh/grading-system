using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Grading.Start;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapStartGrading(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", StartGrading)
            .WithName("StartGrading")
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> StartGrading(
        [FromBody] StartGradingRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.NewComb();
        await commandBus.PublishAsync(new Command(gradingId)
        {
            RubricId = request.RubricId,
            CriteriaFilesMappings = request.CriteriaFilesMappings
        }, cancellationToken);

        return TypedResults.Created();
    }
}
