using EventFlow;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUpdateCriterionSelectors(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id}", UpdateCriterionSelectors)
            .WithName("CreateGrading")
            .Produces(StatusCodes.Status201Created, typeof(string))
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

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

        return TypedResults.NoContent();
    }
}