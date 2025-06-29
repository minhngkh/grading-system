using AssignmentFlow.Application.Gradings.Analytics;
using Sqids;

namespace AssignmentFlow.Application.Shared;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddShared(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        services.AddTransient<IGradingAnalyticService, GradingAnalyticService>();
        services.AddTransient(typeof(ISequenceRepository<>), typeof(SequenceRepository<>));
        return services;
    }
}
