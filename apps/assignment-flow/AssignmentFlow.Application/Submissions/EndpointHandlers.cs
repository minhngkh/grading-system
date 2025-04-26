using AssignmentFlow.Application.Submissions.Upload;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;

namespace AssignmentFlow.Application.Submissions;

internal static class EndpointHandlers
{
    public static IEndpointRouteBuilder MapSubmissionsEndpoints(this IEndpointRouteBuilder routeBuilder)
    {
        // Add your endpoint mappings here
        routeBuilder.MapGroup("/api/v1/submissions")
            .AddFluentValidationAutoValidation()
            .WithTags("Submissions")
            .MapUploadSubmission();
            
        return routeBuilder;
    }
}
