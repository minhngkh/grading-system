using EventFlow;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UpdateInfo;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUpdateInfo(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPut("/{id}/info", UpdateInfo)
            .WithName("UpdateInfo")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> UpdateInfo(
        [FromRoute] string id,
        [FromBody] UpdateInfoRequest request,
        ICommandBus commandBus,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        await commandBus.PublishAsync(new Command(gradingId)
        {
            GradingName = GradingName.New(request.Name)
        }, cancellationToken);

        return TypedResults.Ok();
    }
}
