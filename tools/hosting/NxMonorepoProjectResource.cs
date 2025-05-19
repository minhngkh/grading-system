namespace Aspire.Hosting.ApplicationModel;

public class NxMonorepoProjectResource
    : ExecutableResource,
        IResourceWithParent<NxMonorepoResource>,
        IResourceWithServiceDiscovery
{
    public NxMonorepoProjectResource(
        string name,
        string target,
        string projectName,
        NxMonorepoResource parent
    )
        : base(name, parent.PackageManager.ExecBinary, parent.RootPath)
    {
        ArgumentException.ThrowIfNullOrEmpty(projectName);
        ArgumentException.ThrowIfNullOrEmpty(target);
        ArgumentNullException.ThrowIfNull(parent);

        Parent = parent;
        Project = projectName;
        Target = target;
    }

    public NxMonorepoResource Parent { get; }
    public string Project { get; }
    public string Target { get; }

    public string[] GetRunArgs(string[]? args = null)
    {
        var commandArgs = new List<string>();

        if (Parent.PackageManager.ExecCommand is not null)
        {
            commandArgs.Add(Parent.PackageManager.ExecCommand);
        }

        commandArgs.Add("nx");
        commandArgs.Add("run");
        commandArgs.Add($"{Project}:\"{Target}\"");

        if (args is { Length: > 0 })
        {
            commandArgs.Add("--");
            commandArgs.AddRange(args);
        }

        return [.. commandArgs];
    }
}
