using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Gradings;
using EventFlow.EntityFramework;
using EventFlow.EntityFramework.Extensions;
using EventFlow.Extensions;
using EventFlow.PostgreSql.Connections;
using EventFlow.PostgreSql.EventStores;
using EventFlow.PostgreSql.Extensions;
using FluentValidation;
using JsonApiDotNetCore.Configuration;
using JsonApiDotNetCore.Resources.Annotations;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RubricEngine.Application.Protos;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.Reflection;
namespace AssignmentFlow.Application.Bootstrapping;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBootstrapping(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        services
            .AddOpenApi()
            .AddJwtAuthentication(configuration)
            .AddMessageBus(configuration, typeof(Program).Assembly)
            .AddProjectEventFlow(configuration, typeof(Program).Assembly)
            .AddProjectJsonApi(typeof(Program).Assembly)
            .AddFluentValidation()
            .AddGrpcClients(configuration)
            .AddServiceBootstrapping(configuration);

        services.AddAntiforgery();
        services.AddSignalR();

        services.Configure<FormOptions>(options =>
        {
            options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50 MB;
        });

        return services;
    }

    private static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddAuthorization()
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(jwtOptions =>
            {
                jwtOptions.Authority = configuration["Jwt:Authority"];
                jwtOptions.MetadataAddress = configuration["Jwt:MetadataAddress"]!;
                jwtOptions.IncludeErrorDetails = true; // Set to true for development, false in production
                jwtOptions.RequireHttpsMetadata = false; // Set to false if you are not using HTTPS in development
                jwtOptions.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = false, // Set to false if you want to allow any audience
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true
                };

                // We have to hook the OnMessageReceived event in order to
                // allow the JWT authentication handler to read the access
                // token from the query string when a WebSocket or 
                // Server-Sent Events request comes in.

                // Sending the access token in the query string is required when using WebSockets or ServerSentEvents
                // due to a limitation in Browser APIs. We restrict it to only calls to the
                // SignalR hub in this code.
                // See https://docs.microsoft.com/aspnet/core/signalr/security#access-token-logging
                // for more information about security considerations when using
                // the query string to transmit the access token.
                jwtOptions.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];

                        // If the request is for our hub...
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            (path.StartsWithSegments("/hubs/gradings")))
                        {
                            // Read the token out of the query string
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        return services;
    }

    private static IServiceCollection AddMessageBus(this IServiceCollection services, IConfiguration configuration, Assembly? assembly)
    {
        services.AddMassTransit(config =>
        {
            config.SetKebabCaseEndpointNameFormatter();

            if (assembly != null)
                config.AddConsumers(assembly);

            config.UsingAzureServiceBus((context, configurator) =>
            {
                configurator.Host(configuration.GetConnectionString("messaging"));
                configurator.ConfigureEndpoints(context);
                configurator.UseRawJsonDeserializer(isDefault: true);
            });
        });

        return services;
    }

    private static IServiceCollection AddProjectJsonApi(this IServiceCollection services, Assembly? assembly)
    {
        services.AddJsonApi<AssignmentFlowDbContext>(
            options =>
            {
                options.Namespace = "api/v1";
                options.ClientIdGeneration = ClientIdGenerationMode.Allowed;
                options.IncludeTotalResourceCount = true;
                options.AllowUnknownQueryStringParameters = true;
                options.DefaultPageSize = new PageSize(10); // TODO: Make this configurable
                options.MaximumPageSize = new PageSize(100);
                options.ValidateModelState = true;
                options.UseRelativeLinks = true;
                options.ResourceLinks = LinkTypes.None;
                options.TopLevelLinks = LinkTypes.Pagination;
                options.RelationshipLinks = LinkTypes.None;
            }, discovery: discovery => discovery.AddAssembly(assembly));

        services.AddEndpointsApiExplorer();

        return services;
    }

    private static IServiceCollection AddFluentValidation(this IServiceCollection services)
    {
        services
            .AddValidatorsFromAssemblyContaining<Program>()
            .AddFluentValidationAutoValidation();
        return services;
    }

    private static IServiceCollection AddProjectEventFlow(this IServiceCollection services, IConfiguration configuration, Assembly? assembly)
    {
        services.AddEventFlow(ef => ef
            .Configure(o =>
            {
                o.IsAsynchronousSubscribersEnabled = true;
                o.ThrowSubscriberExceptions = true;
            })
            .ConfigurePostgreSql(PostgreSqlConfiguration.New
                .SetConnectionString(configuration.GetConnectionString("assignmentflowdb")))
            .UseEventPersistence<PostgreSqlEventPersistence>()
            .AddDefaults(typeof(Program).Assembly)
            .ConfigureEntityFramework(EntityFrameworkConfiguration.New)
            .AddDbContextProvider<AssignmentFlowDbContext, AssignmentFlowDbContextProvider>()
            .UseEntityFrameworkReadModel<Grading, AssignmentFlowDbContext>()
            .UseEntityFrameworkReadModel<Assessment, AssignmentFlowDbContext>()
        );

        return services;
    }

    private static IServiceCollection AddGrpcClients(this IServiceCollection services, IConfiguration configuration)
    {
        //Grpc Services
        services.AddGrpcClient<RubricProtoService.RubricProtoServiceClient>(opts =>
        {
            opts.Address = new Uri("https://rubric-engine");
        })
            .ConfigurePrimaryHttpMessageHandler(() =>
            {
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
                };

                return handler;
            });
        return services;
    }

    private static IServiceCollection AddServiceBootstrapping(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddTransient<DbInitializer>();
        return services;
    }
}
