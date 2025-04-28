using AssignmentFlow.Application.Grading.Start;
using AssignmentFlow.Application.Grading.Upload;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;

namespace AssignmentFlow.Application.Grading;

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
