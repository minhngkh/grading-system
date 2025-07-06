using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RubricEngine.Application.Protos;
using System.Security.Claims;

namespace AssignmentFlow.Application.Gradings.Create;

public static partial class EndpointHandler
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
        [FromBody] CreateGradingRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        ClaimsPrincipal user,
        RubricProtoService.RubricProtoServiceClient rubricProto,
        ISequenceRepository<Grading> sequenceRepository,
        CancellationToken cancellationToken)
    {
        var teacherId = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new ArgumentNullException(nameof(user), "Teacher id must have been provided in the claims.");

        var gradingId = GradingId.NewComb();
        await commandBus.PublishAsync(new Command(gradingId)
        {
            Reference = await sequenceRepository.GenerateSequence(),
            TeacherId = TeacherId.With(teacherId),
            RubricId = string.IsNullOrWhiteSpace(request.RubricId) ? null : RubricId.With(request.RubricId),
            Name = string.IsNullOrWhiteSpace(request.Name) ? null : GradingName.New(request.Name),
            ScaleFactor = request.ScaleFactor.HasValue ? ScaleFactor.New(request.ScaleFactor.Value) : ScaleFactor.TenPoint
        }, cancellationToken);

        var grading = await queryProcessor.ProcessAsync(
            new ReadModelByIdQuery<Grading>(gradingId), cancellationToken);

        return TypedResults.CreatedAtRoute<Grading>(grading, "GetGradingById", new { id = gradingId });
    }
}
