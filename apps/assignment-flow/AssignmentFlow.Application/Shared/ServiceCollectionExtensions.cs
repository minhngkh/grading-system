namespace AssignmentFlow.Application.Shared;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddShared(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        return services;
    }
}
