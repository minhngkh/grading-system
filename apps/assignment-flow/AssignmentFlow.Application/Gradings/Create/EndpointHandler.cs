using EventFlow;
using EventFlow.Queries;
using RubricEngine.Application.Protos;

namespace AssignmentFlow.Application.Gradings.Create;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapCreateGrading(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", CreateGrading)
            .WithName("CreateGrading")
            .Produces<Grading>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> CreateGrading(
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        RubricProtoService.RubricProtoServiceClient rubricProto,
        CancellationToken cancellationToken)
    {
        var teacherId = TeacherId.With("teacher");

        var gradingId = GradingId.NewComb();
        await commandBus.PublishAsync(new Command(gradingId)
        {
            TeacherId = teacherId
        }, cancellationToken);

        var grading = await queryProcessor.ProcessAsync(
            new ReadModelByIdQuery<Grading>(gradingId), cancellationToken);

        return TypedResults.CreatedAtRoute<Grading>(grading, "GetGradingById", new { id = gradingId });
    }
}
