using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace GradingSystem.Hosting;

internal class NodePackageInstaller(
    ResourceLoggerService loggerService,
    ResourceNotificationService notificationService
)
{
    private readonly bool isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

    /// <summary>
    /// Finds the Node.js resources using the specified package manager and installs the packages.
    /// </summary>
    /// <param name="appModel">The current AppHost instance.</param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task InstallPackages(
        DistributedApplicationModel appModel,
        CancellationToken cancellationToken = default
    )
    {
        var resource = appModel.Resources.OfType<NxMonorepoResource>().First();

        await PerformInstall(resource, cancellationToken);
    }

    /// <summary>
    /// Performs the installation of packages for the specified Nodejs app resource in a background task and sends notifications to the AppHost.
    /// </summary>
    /// <param name="resource">The Node.js application resource to install packages for.</param>
    /// <param name="cancellationToken"></param>
    /// <exception cref="InvalidOperationException">Thrown if there is no package.json file or the package manager exits with a non-successful error code.</exception>
    private async Task PerformInstall(
        NxMonorepoResource resource,
        CancellationToken cancellationToken
    )
    {
        var logger = loggerService.GetLogger(resource);

        var packageJsonPath = Path.Combine(resource.RootPath, "package.json");

        if (!File.Exists(packageJsonPath))
        {
            await notificationService
                .PublishUpdateAsync(
                    resource,
                    state =>
                        state with
                        {
                            State = new(
                                $"Package.json not found",
                                KnownResourceStateStyles.Error
                            ),
                        }
                )
                .ConfigureAwait(false);

            throw new InvalidOperationException($"Package.json not found");
        }

        await notificationService
            .PublishUpdateAsync(
                resource,
                state =>
                    state with
                    {
                        State = new(
                            $"Installing packages",
                            KnownResourceStateStyles.Info
                        ),
                    }
            )
            .ConfigureAwait(false);

        logger.LogInformation(
            "Installing packages for {resource.Name} using {resource.PackageManager.Name}",
            resource.Name,
            resource.PackageManager.Name
        );

        var packageInstaller = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = isWindows ? "cmd" : resource.PackageManager.InstallBinary,
                Arguments = isWindows
                    ? $"/c {resource.PackageManager.InstallBinary} {resource.PackageManager.InstallCommand}"
                    : $"{resource.PackageManager.InstallCommand}",
                WorkingDirectory = resource.RootPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                UseShellExecute = false,
            },
        };

        packageInstaller.OutputDataReceived += async (sender, args) =>
        {
            if (!string.IsNullOrWhiteSpace(args.Data))
            {
                await notificationService
                    .PublishUpdateAsync(
                        resource,
                        state => state
                        // state =>
                        //     state with
                        //     {
                        //         State = new(args.Data, KnownResourceStates.Starting),
                        //     }
                    )
                    .ConfigureAwait(false);

                logger.LogInformation("{Data}", args.Data);
            }
        };

        packageInstaller.ErrorDataReceived += async (sender, args) =>
        {
            if (!string.IsNullOrWhiteSpace(args.Data))
            {
                await notificationService
                    .PublishUpdateAsync(
                        resource,
                        state => state
                        // state =>
                        //     state with
                        //     {
                        //         State = new(args.Data, KnownResourceStates.FailedToStart),
                        //     }
                    )
                    .ConfigureAwait(false);

                logger.LogError("{Data}", args.Data);
            }
        };

        packageInstaller.Start();
        packageInstaller.BeginOutputReadLine();
        packageInstaller.BeginErrorReadLine();

        await packageInstaller.WaitForExitAsync(cancellationToken).ConfigureAwait(false);

        if (packageInstaller.ExitCode != 0)
        {
            await notificationService
                .PublishUpdateAsync(
                    resource,
                    state =>
                        state with
                        {
                            State = new(
                                $"Error installing",
                                KnownResourceStateStyles.Error
                            ),
                        }
                )
                .ConfigureAwait(false);

            throw new InvalidOperationException(
                $"{resource.PackageManager.Name} install failed with exit code {packageInstaller.ExitCode}"
            );
        }
        else
        {
            await notificationService
                .PublishUpdateAsync(
                    resource,
                    state =>
                        state with
                        {
                            State = new(
                                $"Finished installing",
                                KnownResourceStateStyles.Success
                            ),
                        }
                )
                .ConfigureAwait(false);
        }
    }
}
