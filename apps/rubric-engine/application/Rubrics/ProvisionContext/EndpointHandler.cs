using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace RubricEngine.Application.Rubrics.ProvisionContext;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapProvisionContext(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id:required}/context", ProvisionContext)
            .WithName("ProvisionContext")
            .Produces<string>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> ProvisionContext(
        [FromRoute] string id,
        IFormFileCollection files,
        [FromForm] string? metadataJson,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IOptions<JsonOptions> jsonOptions,
        CancellationToken cancellationToken)
    {
        var rubricId = RubricId.With(id);

        Dictionary<string, object>? metadata = null;
        if (!string.IsNullOrWhiteSpace(metadataJson))
        {
            metadata = JsonSerializer.Deserialize<Dictionary<string, object>>(
                metadataJson,
                jsonOptions.Value.JsonSerializerOptions
            );
        }

        await commandBus.PublishAsync(new Command(rubricId)
        {
            Attachments = files,
            Metadata = metadata
        },
        cancellationToken);

        return Results.Ok("Provisioning complete.");
    }
}
