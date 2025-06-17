using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUpdateCriterionSelectors(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPut("/{id}/criterionSelectors", UpdateCriterionSelectors)
            .WithName("UpdateCriterionSelectors")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> UpdateCriterionSelectors(
        [FromRoute] string id,
        [FromBody] UpdateCriterionSelectorsRequest request,
        ICommandBus commandBus,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        await commandBus.PublishAsync(new Command(gradingId)
        {
            Selectors = request.Selectors.ConvertAll(s => s.ToValueObject())
        }, cancellationToken);

        return TypedResults.Ok();
    }
}
