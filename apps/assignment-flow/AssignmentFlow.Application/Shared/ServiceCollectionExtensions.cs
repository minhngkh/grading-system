using AssignmentFlow.Application.Gradings.Analytics;

namespace AssignmentFlow.Application.Shared;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddShared(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        services.AddTransient<IGradingAnalyticService, GradingAnalyticService>();
        return services;
    }
}
