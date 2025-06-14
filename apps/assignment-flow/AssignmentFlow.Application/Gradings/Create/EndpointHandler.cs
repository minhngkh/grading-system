using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Authorization;
using RubricEngine.Application.Protos;
using System.Security.Claims;

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

    [Authorize]
    private static async Task<IResult> CreateGrading(
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        ClaimsPrincipal user,
        RubricProtoService.RubricProtoServiceClient rubricProto,
        CancellationToken cancellationToken)
    {
        var teacherId = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new ArgumentNullException(nameof(user), "Teacher id must have been provided in the claims.");

        var gradingId = GradingId.NewComb();
        await commandBus.PublishAsync(new Command(gradingId)
        {
            TeacherId = TeacherId.With(teacherId),
        }, cancellationToken);

        var grading = await queryProcessor.ProcessAsync(
            new ReadModelByIdQuery<Grading>(gradingId), cancellationToken);

        return TypedResults.CreatedAtRoute<Grading>(grading, "GetGradingById", new { id = gradingId });
    }
}
