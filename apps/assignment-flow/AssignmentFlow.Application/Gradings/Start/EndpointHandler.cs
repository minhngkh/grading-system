using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.Start;

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
        var teacherId = TeacherId.New("teacher");

        var gradingId = GradingId.NewComb();
        await commandBus.PublishAsync(new Command(gradingId)
        {
            TeacherId = teacherId,
            RubricId = request.RubricId,
            CriteriaFilesMappings = request.CriteriaFilesMappings.ToCriteriaFilesMappings()
        }, cancellationToken);

        return TypedResults.Created();
    }
}
