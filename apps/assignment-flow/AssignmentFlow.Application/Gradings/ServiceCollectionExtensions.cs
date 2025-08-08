using Microsoft.Extensions.DependencyInjection;

namespace AssignmentFlow.Application.Gradings;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddGradings(this IServiceCollection services)
    {
        return services
            .AddTransient<GradingWriteModel>()
            .AddTransient<GradingRepository>()
            .AddTransient<ISubmissionUploadService, SubmissionUploadService>();
    }
}
