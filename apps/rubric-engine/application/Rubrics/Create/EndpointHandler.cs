using System.Security.Claims;
using EventFlow;
using EventFlow.Queries;
using RubricEngine.Application.Shared;

namespace RubricEngine.Application.Rubrics.Create;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapCreateRubric(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", CreateRubric)
            .WithName("CreateRubric")
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> CreateRubric(
        CreateRubricRequest request,
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
                new RubricName(request.Name),
                new TeacherId(teacherId)),
            cancellationToken)
            .ConfigureAwait(false);

        return TypedResults.Created<string>("", rubricId.Value);
    }
}
