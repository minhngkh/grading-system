using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Assessments.UpdateFeedBack;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUpdateFeedbacks(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPut("/{id}/feedbacks", UpdateFeedbacks)
            .WithName("UpdateFeedbacks")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    //[Authorize]
    private static async Task<IResult> UpdateFeedbacks(
        [FromRoute] string id,
        [FromBody] UpdateFeedbacksRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var assessmentId = AssessmentId.With(id);
        await commandBus.PublishAsync(new Command(assessmentId)
        {
            Feedbacks = [.. request.Feedbacks.Select(f => f.ToValueObject())],
        }, cancellationToken);

        return TypedResults.Ok();
    }
}
