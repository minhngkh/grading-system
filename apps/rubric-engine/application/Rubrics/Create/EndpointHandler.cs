using System.Security.Claims;
using EventFlow;
using EventFlow.Queries;

namespace RubricEngine.Application.Rubrics.Create;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapCreateRubric(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", CreateRubric)
            .WithName("CreateRubric")
            .Produces<CreateRubricResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> CreateRubric(
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var teacherId = contextAccessor.HttpContext?
            .User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(teacherId))
        {
            teacherId = "eric.nguyen";
        }

        var rubricId = RubricId.NewComb();

        await commandBus.PublishAsync(
            new Command(
                rubricId,
                new TeacherId(teacherId)),
            cancellationToken)
            .ConfigureAwait(false);

        var rubric = await queryProcessor.ProcessAsync(
            new ReadModelByIdQuery<Rubric>(rubricId), cancellationToken);

        var response = new CreateRubricResponse
        {
            Id = rubric.Id,
            TeacherId = rubric.TeacherId,
            RubricName = rubric.RubricName,
            Tags = rubric.PerformanceTags,
            Criteria = rubric.Criteria,
            UpdatedOn = rubric.UpdatedOn,
            Status = rubric.Status,
            Metadata = rubric.Metadata
        };

        return TypedResults.CreatedAtRoute<CreateRubricResponse>(response, "GetRubricById", new { id = rubricId });
    }
}
