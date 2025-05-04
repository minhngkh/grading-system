var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
                    .WithLifetime(ContainerLifetime.Persistent)
                    .WithPgAdmin();

var rubricDb = postgres.AddDatabase("rubricdb");
var assignmentFlowDb = postgres.AddDatabase("assignmentflowdb");

var username = builder.AddParameter("rb-username", secret: true);
var password = builder.AddParameter("rb-password", secret: true);
var rabbitmq = builder.AddRabbitMQ("messaging", username, password, 5672)
                        .WithManagementPlugin();
 
var blobs = builder.AddAzureStorage("storage")
                        .RunAsEmulator(
                            azurite =>{
                                azurite.WithLifetime(ContainerLifetime.Persistent);
                                azurite.WithBlobPort(27000);
                            })
                        .AddBlobs("submissions-store");

// After adding all resources, run the app...
var rubricEngine = builder.AddProject<Projects.RubricEngine_Application>("rubric-engine")
        .WithReference(rubricDb).WaitFor(rubricDb)
        .WithReference(rabbitmq).WaitFor(rabbitmq);

builder.AddProject<Projects.AssignmentFlow_Application>("assignmentflow-application")
        .WithReference(assignmentFlowDb).WaitFor(assignmentFlowDb)
        .WithReference(blobs).WaitFor(blobs)
        .WithReference(rabbitmq).WaitFor(rabbitmq)
        .WithReference(rubricEngine).WaitFor(rubricEngine);

builder.Build().Run();
