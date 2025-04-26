using AssignmentFlow.Application.Submissions;

namespace AssignmentFlow.Application.Bootstrapping;

public static class EndpointHandlers
{
    public static IEndpointRouteBuilder MapAssignmentFlowEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // Add your endpoint mappings here
        endpoints.MapControllers();
        endpoints.MapSubmissionsEndpoints();

        return endpoints;
    }
}
