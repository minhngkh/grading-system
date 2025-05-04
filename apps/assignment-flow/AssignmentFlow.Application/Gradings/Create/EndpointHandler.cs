using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;
using RubricEngine.Application.Protos;

namespace AssignmentFlow.Application.Gradings.Create;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapCreateGrading(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", CreateGrading)
            .WithName("CreateGrading")
            .Produces(StatusCodes.Status201Created, typeof(string))
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> CreateGrading(
        [FromBody] CreateGradingRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        RubricProtoService.RubricProtoServiceClient rubricProto,
        CancellationToken cancellationToken)
    {
        var teacherId = TeacherId.New("teacher");
        var rubric = await rubricProto.GetRubricAsync(new GetRubricRequest
        {
            RubricId = request.RubricId
        }, cancellationToken: cancellationToken);
        
        var gradingId = GradingId.NewComb();
        await commandBus.PublishAsync(new Command(gradingId)
        {
            TeacherId = teacherId,
            RubricId = RubricId.New(rubric.Id),
            Selectors = request.Selectors.ConvertAll(s => s.ToValueObject())
        }, cancellationToken);

        return TypedResults.Created("/", gradingId.Value);
    }
}
