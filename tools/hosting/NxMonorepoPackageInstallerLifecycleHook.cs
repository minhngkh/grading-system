using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;

namespace GradingSystem.Hosting;

internal class NxMonorepoPackageInstallerLifecycleHook(
    ResourceLoggerService loggerService,
    ResourceNotificationService notificationService,
    DistributedApplicationExecutionContext context) : IDistributedApplicationLifecycleHook
{
    private readonly NodePackageInstaller _installer = new(loggerService, notificationService);

    /// <inheritdoc />
    public Task BeforeStartAsync(DistributedApplicationModel appModel, CancellationToken cancellationToken = default)
    {
        if (context.IsPublishMode)
        {
            return Task.CompletedTask;
        }

        return _installer.InstallPackages(appModel, cancellationToken);
    }
}