using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;

namespace AssignmentFlow.Application.Gradings;

internal static class EndpointHandlers
{
    public static IEndpointRouteBuilder MapGradingsEndpoints(this IEndpointRouteBuilder routeBuilder)
    {
        // Add your endpoint mappings here
        routeBuilder.MapGroup("/api/v1/gradings")
            .AddFluentValidationAutoValidation()
            .WithTags("Gradings")
            .MapStartGrading()
            .MapUploadSubmission();
            
        return routeBuilder;
    }
}
