using EventFlow.EntityFramework;
using EventFlow.EntityFramework.Extensions;
using EventFlow.Extensions;
using EventFlow.PostgreSql.Connections;
using EventFlow.PostgreSql.EventStores;
using EventFlow.PostgreSql.Extensions;
using JsonApiDotNetCore.Configuration;
using Microsoft.EntityFrameworkCore;
using RubricEngine.Application.Bootstrapping;
using RubricEngine.Application.Models;
using RubricEngine.Application.Rubrics;
using RubricEngine.Application.Rubrics.Grpc;
using RubricEngine.Application.Shared;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddNpgsqlDbContext<RubricDbContext>(connectionName: "rubricdb");

if (Environment.GetEnvironmentVariable("USE_SERVICE_BUS") == "true")
{
    builder.AddAzureServiceBusClient(connectionName: "messaging");
}
else
{
    builder.AddRabbitMQClient(connectionName: "messaging");
}

builder.AddAzureBlobClient("rubric-context-store");

builder.Services.AddBootstrapping(builder.Configuration, builder.Environment);
builder.Services.AddShared(builder.Configuration, builder.Environment);

builder.Services.AddEventFlow(ef =>
    ef.Configure(o =>
        {
            o.IsAsynchronousSubscribersEnabled = true;
            o.ThrowSubscriberExceptions = true;
        })
        .ConfigurePostgreSql(
            PostgreSqlConfiguration.New.SetConnectionString(
                builder.Configuration.GetConnectionString("rubricdb")
            )
        )
        .UseEventPersistence<PostgreSqlEventPersistence>()
        .AddDefaults(typeof(Program).Assembly)
        .ConfigureEntityFramework(EntityFrameworkConfiguration.New)
        .AddDbContextProvider<RubricDbContext, RubricDbContextProvider>()
        .UseEntityFrameworkReadModel<Rubric, RubricDbContext>()
);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
    );
});

builder.AddServiceDefaults();

var app = builder.Build();

// Configure the HTTP request pipeline.

app.MapOpenApi();
app.MapScalarApiReference(options => options.Servers = Array.Empty<ScalarServer>());

app.UseCors("AllowAll");

// Initialize the database
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = ActivatorUtilities.CreateInstance<DbInitializer>(
        scope.ServiceProvider
    );
    await dbInitializer.InitializeAsync();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.UseJsonApi();
app.MapGrpcService<RubricService>();
app.MapRubricEngineEndpoints();

app.UseHealthChecks("/health");

app.Run();
