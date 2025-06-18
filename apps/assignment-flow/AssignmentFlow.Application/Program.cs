using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Bootstrapping;
using AssignmentFlow.Application.Gradings;
using EventFlow.EntityFramework;
using EventFlow.EntityFramework.Extensions;
using EventFlow.Extensions;
using EventFlow.PostgreSql.Connections;
using EventFlow.PostgreSql.EventStores;
using EventFlow.PostgreSql.Extensions;
using JsonApiDotNetCore.Configuration;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddNpgsqlDbContext<AssignmentFlowDbContext>(connectionName: "assignmentflowdb");
builder.AddRabbitMQClient(connectionName: "messaging");
builder.AddAzureBlobClient("submissions-store");

builder.Services
    .AddBootstrapping(builder.Configuration, builder.Environment)
    .AddShared(builder.Configuration, builder.Environment)
    .AddGradings();

builder.Services.AddEventFlow(ef => ef
    .Configure(o =>
    {
        o.IsAsynchronousSubscribersEnabled = true;
        o.ThrowSubscriberExceptions = true;
    })
    .ConfigurePostgreSql(PostgreSqlConfiguration.New
        .SetConnectionString(builder.Configuration.GetConnectionString("assignmentflowdb")))
    .UseEventPersistence<PostgreSqlEventPersistence>()
    .AddDefaults(typeof(Program).Assembly)
    .ConfigureEntityFramework(EntityFrameworkConfiguration.New)
    .AddDbContextProvider<AssignmentFlowDbContext, AssignmentFlowDbContextProvider>()
    .UseEntityFrameworkReadModel<Grading, AssignmentFlowDbContext>()
    .UseEntityFrameworkReadModel<Assessment, AssignmentFlowDbContext>()
    .ConfigureOptimisticConcurrencyRetry(retries: 5, delayBeforeRetry: TimeSpan.FromMilliseconds(200))
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

// Initialize the database
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = ActivatorUtilities.CreateInstance<DbInitializer>(scope.ServiceProvider);
    await dbInitializer.InitializeAsync();
}

app.UseHttpsRedirection();

app.UseRouting();
app.UseAntiforgery();

app.UseAuthentication();
app.UseAuthorization();

app.UseJsonApi();
app.MapAssignmentFlowEndpoints();

app.UseHealthChecks("/health");

app.Run();
