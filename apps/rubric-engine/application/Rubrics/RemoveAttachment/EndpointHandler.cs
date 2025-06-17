using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace RubricEngine.Application.Rubrics.RemoveAttachment;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapRemoveAttachment(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapDelete("/{id:required}/attachments/{reference:required}", RemoveAttachment)
            .WithName("RemoveAttachment")
            .Produces<string>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> RemoveAttachment(
        [FromRoute] string id,
        [FromRoute] string reference,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var rubricId = RubricId.With(id);
        await commandBus.PublishAsync(
            new Command(rubricId, reference),
            cancellationToken);

        return TypedResults.Ok();
    }
}
