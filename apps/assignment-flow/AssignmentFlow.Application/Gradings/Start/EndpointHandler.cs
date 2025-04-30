using AssignmentFlow.Application.Shared;
using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;
using RubricEngine.Application.Protos;

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
            CriterionAttachmentsSelectors = request.AttachmentsSelectors.ToCriterionAttachmentsSelectors()
        }, cancellationToken);

        return TypedResults.Created();
    }
}
