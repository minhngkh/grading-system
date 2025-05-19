using System.Diagnostics;
using Aspire.Hosting.ApplicationModel;
using Microsoft.AspNetCore.SignalR;

namespace Aspire.Hosting;

public abstract record JsPackageManager
{
    private string? _execBinary;
    private string? _execCommand;
    private string? _installBinary;
    private string? _installCommand = "install";

    private JsPackageManager(
        string name,
        string binary,
        string? execBinary = null,
        string? execCommand = null
    )
    {
        Name = name;
        Binary = binary;
        _execBinary = execBinary;
        _execCommand = execCommand;
    }

    public string Name { get; init; }
    public string Binary { get; init; }
    public string ExecBinary => _execBinary ?? Binary;
    public string? ExecCommand => _execCommand;
    public string InstallBinary => _installBinary ?? Binary;
    public string InstallCommand => _installCommand ?? "install";

    public sealed record NpmRecord()
        : JsPackageManager("npm", "npm", execBinary: "npx");

    public sealed record PnpmRecord()
        : JsPackageManager("pnpm", "pnpm", execCommand: "exec");

    public static JsPackageManager Npm => new NpmRecord();
    public static JsPackageManager Pnpm => new  PnpmRecord();
}

public class NxMonorepoResource : Resource, IResourceWithWaitSupport
{
    private readonly List<NxMonorepoProjectResource> _projects = [];

    public NxMonorepoResource(
        string name,
        string rootPath,
        JsPackageManager packageManager
    )
        : base(name)
    {
        ArgumentNullException.ThrowIfNull(packageManager);

        RootPath = rootPath;
        PackageManager = packageManager;
    }

    public string RootPath { get; }
    public JsPackageManager PackageManager { get; }

    internal void AddProject(NxMonorepoProjectResource project)
    {
        ArgumentNullException.ThrowIfNull(project);

        Debug.Assert(
            project.Parent == this,
            "Project must belong to this NxMonorepoResource"
        );

        _projects.Add(project);
    }
}
