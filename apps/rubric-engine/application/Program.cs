using EventFlow.Extensions;
using EventFlow.PostgreSql.Connections;
using EventFlow.PostgreSql.Extensions;
using Microsoft.EntityFrameworkCore;
using RubricEngine.Application.Models;
using RubricEngine.Application.Bootstrapping;
using RubricEngine.Application.Shared;
using Scalar.AspNetCore;
using RubricEngine.Application.Rubrics;
using JsonApiDotNetCore.Configuration;
using EventFlow.EntityFramework;
using EventFlow.EntityFramework.Extensions;
using EventFlow.PostgreSql.EventStores;
using RubricEngine.Application.Rubrics.Grpc;
var builder = WebApplication.CreateBuilder(args);

builder.AddNpgsqlDbContext<RubricDbContext>(connectionName: "rubricdb");
builder.AddRabbitMQClient(connectionName: "messaging");
builder.AddAzureBlobClient("rubric-context-store");

builder.Services.AddBootstrapping(builder.Configuration, builder.Environment);
builder.Services.AddShared(builder.Configuration, builder.Environment);

builder.Services.AddEventFlow(ef => ef
    .Configure(o =>
         {
             o.IsAsynchronousSubscribersEnabled = true;
             o.ThrowSubscriberExceptions = true;
         })
    .ConfigurePostgreSql(PostgreSqlConfiguration.New
        .SetConnectionString(builder.Configuration.GetConnectionString("rubricdb")))
    .UseEventPersistence<PostgreSqlEventPersistence>()
    .AddDefaults(typeof(Program).Assembly)
    .ConfigureEntityFramework(EntityFrameworkConfiguration.New)
    .AddDbContextProvider<RubricDbContext, RubricDbContextProvider>()
    .UseEntityFrameworkReadModel<Rubric, RubricDbContext>()
);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

builder.AddServiceDefaults();

var app = builder.Build();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();  
    app.MapScalarApiReference(options => options.Servers = Array.Empty<ScalarServer>());
}

app.UseCors("AllowAll");

//TODO: Add authentication and authorization middleware

// Initialize the database
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = ActivatorUtilities.CreateInstance<DbInitializer>(scope.ServiceProvider);
    await dbInitializer.InitializeAsync();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseJsonApi();
app.MapGrpcService<RubricService>();
app.MapRubricEngineEndpoints();

app.UseHealthChecks("/health");

app.Run();
