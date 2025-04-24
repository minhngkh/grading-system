using RubricEngine.Application.Rubrics;

namespace RubricEngine.Application.Bootstrapping;

public static class EndpointHandlers
{
    public static IEndpointRouteBuilder MapRubricEngineEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // Add your endpoint mappings here
        endpoints.MapControllers();
        endpoints.MapRubricEndpoints();

        return endpoints;
    }
}
