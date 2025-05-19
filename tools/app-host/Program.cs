// Silent the null reference warning since null resource refs are okay
#pragma warning disable CS8604 // Possible null reference argument.

using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

var rootPath = "../..";
var configPath = Path.Combine(builder.AppHostDirectory, "config");
var username = builder.AddParameter("dev-username", secret: true);
var password = builder.AddParameter("dev-password", secret: true);
var toProxy = builder.Configuration.GetValue<bool?>("ProxyEnabled") ?? true;

var postgres = builder.AddPostgres("postgres", username, password).WithDataVolume();

var rubricDb = postgres.AddDatabase("rubricdb");
var assignmentFlowDb = postgres.AddDatabase("assignmentflowdb");

var dbgateContainer = builder.AddContainer("dbgate", "dbgate/dbgate", "alpine");
var dbgate = dbgateContainer
    .WaitFor(postgres)
    .WithVolume(VolumeNameGenerator.Generate(dbgateContainer, "data"), "/root/.dbgate")
    .WithHttpEndpoint(targetPort: 3000, name: "dbgate-ui")
    .WithEnvironment(ctx =>
    {
        ctx.EnvironmentVariables["CONNECTIONS"] = "con1";
        ctx.EnvironmentVariables["LABEL_con1"] = "postgres";
        ctx.EnvironmentVariables["SERVER_con1"] = postgres.Resource.Name;
        ctx.EnvironmentVariables["PORT_con1"] =
            postgres.Resource.PrimaryEndpoint.TargetPort?.ToString() ?? "";
        ctx.EnvironmentVariables["USER_con1"] =
            postgres.Resource.UserNameParameter?.Value ?? "postgres";
        ctx.EnvironmentVariables["PASSWORD_con1"] = postgres
            .Resource
            .PasswordParameter
            .Value;
        ctx.EnvironmentVariables["ENGINE_con1"] = "postgres@dbgate-plugin-postgres";
    });

var rabbitmq = builder
    .AddRabbitMQ("messaging", username, password)
    .WithManagementPlugin();

var blobs = builder
    .AddAzureStorage("storage")
    .RunAsEmulator(azurite =>
    {
        azurite.WithDataVolume();
    })
    .AddBlobs("submissions-store");

IResourceBuilder<ProjectResource>? rubricEngine = null;
if (builder.Configuration.GetValue<bool?>("RubricEngine:Enabled") ?? true)
{
    rubricEngine = builder
        .AddProject<Projects.RubricEngine_Application>("rubric-engine")
        .WithHttpEndpoint(
            port: builder.Configuration.GetValue<int?>("RubricEngine:Port"),
            isProxied: toProxy
        )
        .WithReference(rubricDb)
        .WaitFor(rubricDb)
        .WithReference(rabbitmq)
        .WaitFor(rabbitmq);
}

IResourceBuilder<ProjectResource>? assignmentFlow = null;
if (builder.Configuration.GetValue<bool?>("AssignmentFlow:Enabled") ?? true)
{
    assignmentFlow = builder
        .AddProject<Projects.AssignmentFlow_Application>("assignmentflow-application")
        .WithHttpEndpoint(
            port: builder.Configuration.GetValue<int?>("AssignmentFlow:Port"),
            isProxied: toProxy
        )
        .WithReference(assignmentFlowDb)
        .WaitFor(assignmentFlowDb)
        .WithReference(blobs)
        .WaitFor(blobs)
        .WithReference(rabbitmq)
        .WaitFor(rabbitmq)
        .WithReference(rubricEngine)
        .WaitFor(rubricEngine);
}

var nx = builder
    .AddNxMonorepo("nx", rootPath, JsPackageManager.Pnpm)
    .WithPackageInstallation();

IResourceBuilder<NxMonorepoProjectResource>? userSite = null;
if (builder.Configuration.GetValue<bool?>("UserSite:Enabled") ?? true)
{
    userSite = nx.AddProject("user-site", "dev")
        .WithHttpEndpoint(
            port: builder.Configuration.GetValue<int?>("UserSite:Port"),
            isProxied: toProxy,
            env: "PORT"
        )
        .WithReference(rubricEngine)
        .WaitFor(rubricEngine);
}

builder.Build().Run();

#pragma warning restore CS8604 // Possible null reference argument.
