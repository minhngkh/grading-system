using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics; // Required for Process

namespace Aspire.Hosting;

// Annotation to mark an NxMonorepoResource for automatic package installation
public static class NxMonorepoResourceAnnotations
{
    public sealed class AutoInstallPackagesAnnotation : IResourceAnnotation { }
}

public class NxMonorepoPackageInstallerHook : IDistributedApplicationLifecycleHook
{
    private readonly ILogger<NxMonorepoPackageInstallerHook> _logger;

    public NxMonorepoPackageInstallerHook(ILogger<NxMonorepoPackageInstallerHook> logger)
    {
        _logger = logger;
    }

    public Task BeforeStartAsync(DistributedApplicationModel appModel, CancellationToken cancellationToken = default)
    {
        foreach (var resource in appModel.Resources.OfType<NxMonorepoResource>())
        {
            if (resource.Annotations.OfType<NxMonorepoResourceAnnotations.AutoInstallPackagesAnnotation>().Any())
            {
                _logger.LogInformation("NxMonorepoResource '{ResourceName}' has AutoInstallPackagesAnnotation. Initiating package installation.", resource.Name);

                var packageManager = resource.PackageManager;
                var workingDirectory = resource.RootPath;

                var psi = new ProcessStartInfo
                {
                    FileName = packageManager.InstallBinary,
                    Arguments = packageManager.InstallCommand,
                    WorkingDirectory = workingDirectory,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                _logger.LogInformation("Executing package installation: {FileName} {Arguments} in {WorkingDirectory}", psi.FileName, psi.Arguments, psi.WorkingDirectory);

                try
                {
                    using var process = Process.Start(psi);
                    if (process == null)
                    {
                        _logger.LogError("Failed to start package installation process for '{ResourceName}'.", resource.Name);
                        continue;
                    }
                    
                    process.WaitForExit(); 

                    string output = process.StandardOutput.ReadToEnd();
                    string error = process.StandardError.ReadToEnd();

                    if (process.ExitCode == 0)
                    {
                        _logger.LogInformation("Package installation for '{ResourceName}' completed successfully.", resource.Name);
                        if (!string.IsNullOrWhiteSpace(output))
                        {
                            _logger.LogDebug("Package installation output for '{ResourceName}':\n{Output}", resource.Name, output);
                        }
                    }
                    else
                    {
                        _logger.LogError("Package installation for '{ResourceName}' failed with exit code {ExitCode}.", resource.Name, process.ExitCode);
                        if (!string.IsNullOrWhiteSpace(output))
                        {
                            _logger.LogWarning("Package installation output for '{ResourceName}' (on error):\n{Output}", resource.Name, output);
                        }
                        if (!string.IsNullOrWhiteSpace(error))
                        {
                            _logger.LogError("Package installation error for '{ResourceName}':\n{Error}", resource.Name, error);
                        }
                    }
                }
                catch (System.Exception ex)
                {
                    _logger.LogError(ex, "An exception occurred during package installation for '{ResourceName}'.", resource.Name);
                }
            }
        }
        return Task.CompletedTask;
    }
}
