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

IResourceBuilder<ContainerResource>? testRunnerPluginTool = null;
if (
    builder.Configuration.GetValue<bool>("PluginService:Plugins:TestRunner:Enabled", true)
)
{
    testRunnerPluginTool = builder
        .AddDockerfile(
            "test-runner-plugin-tool",
            Path.Combine(rootPath, "libs", "plugin-tools", "test-runner")
        )
        .WithHttpEndpoint(
            targetPort: 5050,
            port: builder.Configuration.GetValue<int?>(
                "PluginService:Plugins:TestRunner:Port"
            )
        )
        .WithContainerRuntimeArgs(
            [
                "--privileged",
                "--shm-size=256m",
                "--add-host=host.docker.internal:host-gateway",
            ]
        );
}

var mongo = builder
    .AddMongoDB("mongo", userName: username, password: password)
    .WithDataVolume();

var pluginDb = mongo.AddDatabase("plugindb");

IResourceBuilder<IResourceWithConnectionString> rubricDb;
IResourceBuilder<IResourceWithConnectionString> assignmentFlowDb;
if (builder.Configuration.GetValue<bool>("Infra:UseDeploymentParts:Postgres", false))
{
    var rubricDbConnectionString = builder.AddParameter(
        "rubricDbConnectionString",
        secret: true,
        value: Environment.GetEnvironmentVariable("RUBRIC_DB_CONNECTION_STRING")
            ?? throw new InvalidOperationException(
                "RUBRIC_DB_CONNECTION_STRING environment variable is not set."
            )
    );

    var assignmentFlowDbConnectionString = builder.AddParameter(
        "assignmentFlowDbConnectionString",
        secret: true,
        value: Environment.GetEnvironmentVariable("ASSIGNMENTFLOW_DB_CONNECTION_STRING")
            ?? throw new InvalidOperationException(
                "ASSIGNMENTFLOW_DB_CONNECTION_STRING environment variable is not set."
            )
    );

    rubricDb = builder.AddConnectionString(
        "rubricdb",
        ReferenceExpression.Create($"{rubricDbConnectionString}")
    );

    assignmentFlowDb = builder.AddConnectionString(
        "assignmentflowdb",
        ReferenceExpression.Create($"{assignmentFlowDbConnectionString}")
    );
}
else
{
    var postgres = builder.AddPostgres("postgres", username, password).WithDataVolume();
    rubricDb = postgres.AddDatabase("rubricdb");
    assignmentFlowDb = postgres.AddDatabase("assignmentflowdb");

    var dbgateContainer = builder.AddContainer("dbgate", "dbgate/dbgate", "alpine");
    var dbgate = dbgateContainer
        .WaitFor(postgres)
        .WithVolume(
            VolumeNameGenerator.Generate(dbgateContainer, "data"),
            "/root/.dbgate"
        )
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
}

IResourceBuilder<IResourceWithConnectionString> messaging;
if (builder.Configuration.GetValue<bool>("Infra:UseDeploymentParts:ServiceBus", false))
{
    var serviceBusConnectionString = builder.AddParameter(
        "serviceBusConnectionString",
        secret: true,
        value: Environment.GetEnvironmentVariable("SERVICE_BUS_CONNECTION_STRING")
            ?? throw new InvalidOperationException(
                "SERVICE_BUS_CONNECTION_STRING environment variable is not set."
            )
    );

    messaging = builder.AddConnectionString(
        "messaging",
        ReferenceExpression.Create($"{serviceBusConnectionString}")
    );
}
else
{
    messaging = builder
        .AddRabbitMQ("messaging", username, password)
        .WithManagementPlugin(
            port: builder.Configuration.GetValue<int?>("Infra:RabbitMQ:Management:Port")
        );
}

IResourceBuilder<IResourceWithConnectionString> submissionStore;
IResourceBuilder<IResourceWithConnectionString> rubricContextStore;
string storageUrl;
if (builder.Configuration.GetValue<bool>("Infra:UseDeploymentParts:Storage", false))
{
    var storageConnectionString = builder.AddParameter(
        "storageConnectionString",
        secret: true,
        value: Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING")
            ?? throw new InvalidOperationException(
                "STORAGE_CONNECTION_STRING environment variable is not set."
            )
    );

    storageUrl =
        Environment.GetEnvironmentVariable("STORAGE_URL")
        ?? throw new InvalidOperationException(
            "STORAGE_URL environment variable is not set."
        );

    submissionStore = builder.AddConnectionString(
        "submissions-store",
        ReferenceExpression.Create($"{storageConnectionString}")
    );
    rubricContextStore = builder.AddConnectionString(
        "rubric-context-store",
        ReferenceExpression.Create($"{storageConnectionString}")
    );
}
else
{
    var storage = builder
        .AddAzureStorage("storage")
        .RunAsEmulator(azurite =>
        {
            azurite.WithDataVolume().WithBlobPort(27000);
        });

    submissionStore = storage.AddBlobs("submissions-store");
    rubricContextStore = storage.AddBlobs("rubric-context-store");

    storageUrl = "http://127.0.0.1:27000/devstoreaccount1";
}

IResourceBuilder<ProjectResource>? rubricEngine = null;
if (builder.Configuration.GetValue<bool>("RubricEngine:Enabled", true))
{
    rubricEngine = builder
        .AddProject<Projects.RubricEngine_Application>("rubric-engine")
        .WithHttpsEndpoint(
            port: builder.Configuration.GetValue<int?>("RubricEngine:Port"),
            isProxied: toProxy
        )
        .WithReference(rubricDb)
        .WaitFor(rubricDb)
        .WithReference(rubricContextStore)
        .WaitFor(rubricContextStore)
        .WithReference(messaging)
        .WaitFor(messaging);
}

IResourceBuilder<ProjectResource>? assignmentFlow = null;
if (builder.Configuration.GetValue<bool>("AssignmentFlow:Enabled", true))
{
    assignmentFlow = builder
        .AddProject<Projects.AssignmentFlow_Application>("assignmentflow-application")
        .WithHttpsEndpoint(
            port: builder.Configuration.GetValue<int?>("AssignmentFlow:Port"),
            isProxied: toProxy
        )
        .WithReference(assignmentFlowDb)
        .WaitFor(assignmentFlowDb)
        .WithReference(submissionStore)
        .WaitFor(submissionStore)
        .WithReference(messaging)
        .WaitFor(messaging)
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
        .WithReference(messaging)
        .WaitFor(messaging)
        .WithReference(submissionStore)
        .WaitFor(submissionStore)
        .WithReference(rubricContextStore)
        .WaitFor(rubricContextStore)
        .WaitFor(testRunnerPluginTool);
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
        .WithReference(messaging)
        .WaitFor(messaging)
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

            ctx.EnvironmentVariables["VITE_BLOB_STORAGE_URL"] = storageUrl;
        });
}

builder.Build().Run();
