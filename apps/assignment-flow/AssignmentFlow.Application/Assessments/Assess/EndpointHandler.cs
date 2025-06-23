using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Assessments.Assess;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapAssess(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}/scores", Assess)
            .WithName("Assess")
            .Produces(StatusCodes.Status202Accepted)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> Assess(
        [FromRoute] string id,
        [FromBody] AssessRequest request,
        ICommandBus commandBus,
        CancellationToken cancellationToken)
    {
        var assessmentId = AssessmentId.With(id);

        await commandBus.PublishAsync(new Command(assessmentId)
        {
            ScoreBreakdowns = request.ScoreBreakdowns.ToValueObject(),
            Grader = Grader.Teacher
        }, cancellationToken);

        return TypedResults.Accepted(uri: "");
    }
}
