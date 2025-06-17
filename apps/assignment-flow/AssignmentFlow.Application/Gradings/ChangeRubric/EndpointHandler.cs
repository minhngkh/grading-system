using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.ChangeRubric;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapChangeRubric(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPut("/{id}/rubric", ChangeRubric)
            .WithName("ChangeRubric")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> ChangeRubric(
        [FromRoute] string id,
        [FromBody] ChangeRubricRequest request,
        ICommandBus commandBus,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        await commandBus.PublishAsync(new Command(gradingId)
        {
            Rubric = RubricId.With(request.RubricId)
        }, cancellationToken);

        return TypedResults.Ok();
    }
}
