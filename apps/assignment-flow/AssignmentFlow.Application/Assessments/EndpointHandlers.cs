using AssignmentFlow.Application.Assessments.AdjustScore;
using AssignmentFlow.Application.Assessments.UpdateFeedBack;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;

namespace AssignmentFlow.Application.Assessments;

internal static class EndpointHandlers
{
    public static IEndpointRouteBuilder MapAssessmentsEndpoints(this IEndpointRouteBuilder routeBuilder)
    {
        // Add your endpoint mappings here
        routeBuilder.MapGroup("/api/v1/assessments")
            .AddFluentValidationAutoValidation()
            .WithTags("Assessments")
            .MapAdjustScore()
            .MapUpdateFeedbacks();

        return routeBuilder;
    }
}
