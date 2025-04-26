using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
                    .WithLifetime(ContainerLifetime.Persistent)
                    .WithPgAdmin();

var postgresdb = postgres.AddDatabase("rubricdb");

var rabbitmq = builder.AddRabbitMQ("messaging")
                      .WithManagementPlugin();

// After adding all resources, run the app...
builder.AddProject<Projects.RubricEngine_Application>("rubric-engine")
        .WithReference(postgresdb).WaitFor(postgresdb)
        .WithReference(rabbitmq).WaitFor(rabbitmq);
        

builder.Build().Run();
