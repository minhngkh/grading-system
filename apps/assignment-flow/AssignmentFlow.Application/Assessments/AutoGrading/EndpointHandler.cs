using EventFlow;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapStartAutoGrading(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}/startAutoGrading", StartAutoGrading)
            .WithName("StartAutoGrading")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    //[Authorize]
    private static async Task<IResult> StartAutoGrading(
        [FromRoute] string id,
        ICommandBus commandBus,
        CancellationToken cancellationToken)
    {
        var assessmentId = AssessmentId.With(id);

        await commandBus.PublishAsync(new StartAutoGradingCommand(assessmentId), cancellationToken);

        return TypedResults.Accepted(uri: "");
    }
}
