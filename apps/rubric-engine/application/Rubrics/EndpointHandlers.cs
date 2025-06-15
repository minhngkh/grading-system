using RubricEngine.Application.Rubrics.Create;
using RubricEngine.Application.Rubrics.ProvisionContext;
using RubricEngine.Application.Rubrics.Update;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;

namespace RubricEngine.Application.Rubrics;

internal static class EndpointHandlers
{
    public static IEndpointRouteBuilder MapRubricEndpoints(this IEndpointRouteBuilder routeBuilder)
    {
        // Add your endpoint mappings here
        routeBuilder.MapGroup("/api/v1/rubrics")
            .AddFluentValidationAutoValidation()
            .WithTags("Rubrics")
            .MapCreateRubric()
            .MapUpdateRubric()
            .MapProvisionContext();
            
        return routeBuilder;
    }
}
