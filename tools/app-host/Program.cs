using Aspire.Hosting;
using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

var rootPath = "../..";
var configPath = Path.Combine(builder.AppHostDirectory, "config");
var username = builder.AddParameter("dev-username", secret: true);
var password = builder.AddParameter("dev-password", secret: true);
var toProxy = builder.Configuration.GetValue<bool>("ProxyEnabled", true);

// var piston = builder
//     .AddContainer("piston", "ghcr.io/engineer-man/piston")
//     .WithHttpEndpoint(port: 2000, targetPort: 2000)
//     .WithBindMount(
//         source: Path.Combine(rootPath, "tmp", "piston", "packages"),
//         target: "/piston/packages"
//     )
//     .WithContainerRuntimeArgs(["--privileged"]);

var postgres = builder.AddPostgres("postgres", username, password).WithDataVolume();

var rubricDb = postgres.AddDatabase("rubricdb");
var assignmentFlowDb = postgres.AddDatabase("assignmentflowdb");

var mongo = builder
    .AddMongoDB("mongo", userName: username, password: password)
    .WithDataVolume();

var pluginDb = mongo.AddDatabase("plugindb");

var dbgateContainer = builder.AddContainer("dbgate", "dbgate/dbgate", "alpine");
var dbgate = dbgateContainer
    .WaitFor(postgres)
    .WithVolume(VolumeNameGenerator.Generate(dbgateContainer, "data"), "/root/.dbgate")
    .WithHttpEndpoint(targetPort: 3000, name: "dbgate-ui")
    .WithEnvironment(ctx =>
    {
        ctx.EnvironmentVariables["CONNECTIONS"] = "con1,con2";
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

        ctx.EnvironmentVariables["LABEL_con2"] = "mongo";
        ctx.EnvironmentVariables["SERVER_con2"] = mongo.Resource.Name;
        ctx.EnvironmentVariables["PORT_con2"] =
            mongo.Resource.PrimaryEndpoint.TargetPort?.ToString() ?? "";
        ctx.EnvironmentVariables["USER_con2"] =
            mongo.Resource.UserNameParameter?.Value ?? "";
        ctx.EnvironmentVariables["PASSWORD_con2"] =
            mongo.Resource.PasswordParameter?.Value ?? "";
        ctx.EnvironmentVariables["ENGINE_con2"] = "mongo@dbgate-plugin-mongo";
    });

var existingServiceBusName = builder.AddParameter("existingServiceBusName");
var existingServiceBusResourceGroup = builder.AddParameter("existingServiceBusResourceGroup");
var serviceBusSharedAccessKey = builder.AddParameter("serviceBusSharedAccessKey", secret: true);
var serviceBus = builder.AddConnectionString("messaging",
    ReferenceExpression.Create($"Endpoint=sb://{existingServiceBusName}.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey={serviceBusSharedAccessKey}"));

var storage = builder
    .AddAzureStorage("storage")
    .RunAsEmulator(azurite =>
    {
        azurite.WithDataVolume().WithBlobPort(27000);
    });

var submissionStore = storage.AddBlobs("submissions-store");
var rubricContextStore = storage.AddBlobs("rubric-context-store");

IResourceBuilder<ProjectResource>? rubricEngine = null;
if (builder.Configuration.GetValue<bool>("RubricEngine:Enabled", true))
{
    rubricEngine = builder
        .AddProject<Projects.RubricEngine_Application>("rubric-engine")
        .WithHttpsEndpoint(
            name: "rubric-engine",
            port: builder.Configuration.GetValue<int?>("RubricEngine:Port"),
            isProxied: toProxy
        )
        .WithReference(rubricDb)
        .WaitFor(rubricDb)
        .WithReference(rubricContextStore)
        .WaitFor(rubricContextStore)
        .WithReference(serviceBus)
        .WaitFor(serviceBus);
}

IResourceBuilder<ProjectResource>? assignmentFlow = null;
if (builder.Configuration.GetValue<bool>("AssignmentFlow:Enabled", true))
{
    assignmentFlow = builder
        .AddProject<Projects.AssignmentFlow_Application>("assignmentflow-application")
        .WithHttpsEndpoint(
            name: "assignmentflow-application",
            port: builder.Configuration.GetValue<int?>("AssignmentFlow:Port"),
            isProxied: toProxy
        )
        .WithReference(assignmentFlowDb)
        .WaitFor(assignmentFlowDb)
        .WithReference(submissionStore)
        .WaitFor(submissionStore)
        .WithReference(serviceBus)
        .WaitFor(serviceBus)
        .WithReference(rubricEngine)
        .WaitFor(rubricEngine);
}

var nx = builder
    .AddNxMonorepo("nx", rootPath, JsPackageManager.Pnpm)
    .WithPackageInstallation();

IResourceBuilder<NxMonorepoProjectResource>? pluginService = null;
if (builder.Configuration.GetValue<bool>("PluginService:Enabled", true))
{
    pluginService = nx.AddProject("plugin-service", "dev")
        .WithHttpEndpoint(
            port: builder.Configuration.GetValue<int?>("PluginService:Port"),
            isProxied: toProxy,
            env: "PORT"
        )
        .WithReference(pluginDb)
        .WaitFor(pluginDb)
        .WithReference(serviceBus)
        .WaitFor(serviceBus)
        .WithReference(submissionStore)
        .WaitFor(submissionStore)
        .WithReference(rubricContextStore)
        .WaitFor(rubricContextStore);
}

IResourceBuilder<NxMonorepoProjectResource>? gradingService = null;
if (builder.Configuration.GetValue<bool>("GradingService:Enabled", true))
{
    gradingService = nx.AddProject("grading-service", "dev")
        .WithHttpEndpoint(
            port: builder.Configuration.GetValue<int?>("GradingService:Port"),
            isProxied: toProxy,
            env: "PORT"
        )
        .WithReference(serviceBus)
        .WaitFor(serviceBus)
        .WithReference(submissionStore)
        .WaitFor(submissionStore)
        .WithReference(rubricContextStore)
        .WaitFor(rubricContextStore);
}

IResourceBuilder<NxMonorepoProjectResource>? userSite = null;
if (builder.Configuration.GetValue<bool>("UserSite:Enabled", true))
{
    userSite = nx.AddProject("user-site", "dev")
        .WithHttpEndpoint(
            port: builder.Configuration.GetValue<int?>("UserSite:Port"),
            isProxied: toProxy,
            env: "PORT"
        )
        .WaitFor(rubricEngine)
        .WaitFor(assignmentFlow)
        // TODO: Back to using references instead of doing this manually
        .WithEnvironment(ctx =>
        {
            var pluginServiceEndpoint = pluginService?.GetEndpoint("http");
            ctx.EnvironmentVariables["VITE_PLUGIN_SERVICE_URL"] =
                pluginServiceEndpoint?.Url ?? "";

            var rubricEngineEndpoint = rubricEngine?.GetEndpoint("https");
            ctx.EnvironmentVariables["VITE_RUBRIC_ENGINE_URL"] =
                rubricEngineEndpoint?.Url ?? "";

            var assignmentFlowEndpoint = assignmentFlow?.GetEndpoint("https");
            ctx.EnvironmentVariables["VITE_ASSIGNMENT_FLOW_URL"] =
                assignmentFlowEndpoint?.Url ?? "";

            ctx.EnvironmentVariables["VITE_BLOB_STORAGE_URL"] = "http://127.0.0.1:27000/devstoreaccount1";
        });
}

builder.Build().Run();
