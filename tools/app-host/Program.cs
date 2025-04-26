var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
                    .WithLifetime(ContainerLifetime.Persistent)
                    .WithPgAdmin();

var rubricDb = postgres.AddDatabase("rubricdb");
var assignmentFlowDb = postgres.AddDatabase("assignmentflowdb");

var rabbitmq = builder.AddRabbitMQ("messaging")
                        .WithManagementPlugin();

var blobs = builder.AddAzureStorage("storage")
                        .RunAsEmulator()
                        .AddBlobs("submissions-store");

// After adding all resources, run the app...
builder.AddProject<Projects.RubricEngine_Application>("rubric-engine")
        .WithReference(rubricDb).WaitFor(rubricDb)
        .WithReference(rabbitmq).WaitFor(rabbitmq);

builder.AddProject<Projects.AssignmentFlow_Application>("assignmentflow-application")
        .WithReference(assignmentFlowDb).WaitFor(assignmentFlowDb)
        .WithReference(blobs).WaitFor(blobs)
        .WithReference(rabbitmq).WaitFor(rabbitmq);

builder.Build().Run();
