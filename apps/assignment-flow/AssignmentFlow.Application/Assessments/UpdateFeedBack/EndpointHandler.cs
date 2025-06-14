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
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static IResult UpdateFeedbacks(
        [FromRoute] string id,
        [FromBody] UpdateFeedbacksRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var teacherId = TeacherId.With("teacher");

        return TypedResults.Accepted(uri: "");
    }
}
