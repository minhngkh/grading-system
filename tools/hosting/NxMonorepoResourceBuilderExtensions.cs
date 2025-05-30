using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Lifecycle;
using GradingSystem.Hosting;
using Microsoft.Extensions.Hosting;

namespace Aspire.Hosting;

public static class NxMonorepoResourceBuilderExtensions
{
    public static IResourceBuilder<NxMonorepoResource> AddNxMonorepo(
        this IDistributedApplicationBuilder builder,
        [ResourceName] string name,
        string rootPath,
        JsPackageManager packageManager
    )
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrEmpty(name);
        ArgumentException.ThrowIfNullOrEmpty(rootPath);
        ArgumentNullException.ThrowIfNull(packageManager);

        rootPath = NormalizePathForCurrentPlatform(
            Path.Combine(builder.AppHostDirectory, rootPath)
        );

        var resource = new NxMonorepoResource(name, rootPath, packageManager);

        var resourceBuilder = builder
            .AddResource(resource)
            .WithInitialState(
                new CustomResourceSnapshot
                {
                    ResourceType = "nxMonorepo",
                    Properties = [],
                    State = new ResourceStateSnapshot(
                        KnownResourceStates.Hidden,
                        KnownResourceStateStyles.Info
                    ),
                    StartTimeStamp = DateTime.UtcNow,
                }
            );

        return resourceBuilder;
    }

    public static IResourceBuilder<NxMonorepoProjectResource> AddProject(
        this IResourceBuilder<NxMonorepoResource> builder,
        [ResourceName] string name,
        string target,
        string? projectName = null,
        string[]? args = null
    )
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrEmpty(name);
        ArgumentException.ThrowIfNullOrEmpty(target);

        projectName ??= name;

        var project = new NxMonorepoProjectResource(
            name,
            target,
            projectName,
            builder.Resource
        );

        builder.Resource.AddProject(project);

        return builder
            .ApplicationBuilder.AddResource(project)
            .WithNodeDefaults()
            .WithArgs(project.GetRunArgs(args))
            .WithParentRelationship(builder.Resource);
    }

    public static IResourceBuilder<NxMonorepoResource> WithPackageInstallation(
        this IResourceBuilder<NxMonorepoResource> builder
    )
    {
        builder.ApplicationBuilder.Services.TryAddLifecycleHook<NxMonorepoPackageInstallerLifecycleHook>();

        return builder;
    }

    private static IResourceBuilder<NxMonorepoProjectResource> WithNodeDefaults(
        this IResourceBuilder<NxMonorepoProjectResource> builder
    ) =>
        builder
            .WithOtlpExporter()
            .WithEnvironment(
                "NODE_ENV",
                builder.ApplicationBuilder.Environment.IsDevelopment()
                    ? "development"
                    : "production"
            );

    private static string NormalizePathForCurrentPlatform(this string path)
    {
        if (string.IsNullOrWhiteSpace(path) == true)
        {
            return path;
        }

        // Fix slashes
        path = path.Replace('\\', Path.DirectorySeparatorChar)
            .Replace('/', Path.DirectorySeparatorChar);

        return Path.GetFullPath(path);
    }
}
