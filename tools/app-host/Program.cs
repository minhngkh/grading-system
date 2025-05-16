var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume("postgres-data");
    // .WithPgAdmin(); // Use dbgate instead 

var rubricDb = postgres.AddDatabase("rubricdb");
var assignmentFlowDb = postgres.AddDatabase("assignmentflowdb");

var configPath = Path.Combine(
    builder.AppHostDirectory,
    "config"
);

// builder.AddContainer("bytebase", "bytebase/bytebase")
//     .WaitFor(postgres)
//     // .WithVolume("/var/opt/bytebase")
//     .WithHttpEndpoint(targetPort: 8080, name: "bytebase-ui")
//     .WithArgs([
//         "--disable-metric",
//         "--disable-sample",
//     ]);

builder.AddContainer("dbgate", "dbgate/dbgate", "alpine")
    .WithVolume("dbgate-data", "/root/.dbgate")
    .WithHttpEndpoint(targetPort: 3000, name: "dbgate-ui")
    .WithEnvironment(ctx =>
    {
        ctx.EnvironmentVariables["CONNECTIONS"] = "con1";
        ctx.EnvironmentVariables["LABEL_con1"] = "postgres";
        ctx.EnvironmentVariables["SERVER_con1"] = "postgres";
        ctx.EnvironmentVariables["USER_con1"] = postgres.Resource.UserNameParameter?.Value ?? "postgres";
        ctx.EnvironmentVariables["PASSWORD_con1"] = postgres.Resource.PasswordParameter.Value;
        ctx.EnvironmentVariables["ENGINE_con1"] = "postgres@dbgate-plugin-postgres";
    });


var username = builder.AddParameter("rb-username", secret: true);
var password = builder.AddParameter("rb-password", secret: true);
var rabbitmq = builder.AddRabbitMQ("messaging")
    .WithManagementPlugin();

var blobs = builder.AddAzureStorage("storage")
    .RunAsEmulator(
        azurite =>
        {
            azurite.WithDataVolume("storage-azurite-data");
        }
    )
    .AddBlobs("submissions-store");

var rubricEngine = builder.AddProject<Projects.RubricEngine_Application>("rubric-engine")
    .WithReference(rubricDb).WaitFor(rubricDb)
    .WithReference(rabbitmq).WaitFor(rabbitmq);

builder.AddProject<Projects.AssignmentFlow_Application>("assignmentflow-application")
    .WithReference(assignmentFlowDb).WaitFor(assignmentFlowDb)
    .WithReference(blobs).WaitFor(blobs)
    .WithReference(rabbitmq).WaitFor(rabbitmq)
    .WithReference(rubricEngine).WaitFor(rubricEngine);

builder.Build().Run();
