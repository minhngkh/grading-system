﻿using FluentValidation;
using JsonApiDotNetCore.Configuration;
using JsonApiDotNetCore.Resources.Annotations;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using RubricEngine.Application.Protos;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.Reflection;
namespace AssignmentFlow.Application.Bootstrapping;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBootstrapping(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        // Add application services here
        // Example: services.AddScoped<IMyService, MyService>();
        services
            .AddOpenApi()
            .AddJwtAuthentication(configuration)
            .AddMessageBus(configuration, typeof(Program).Assembly)
            .AddProjectJsonApi(typeof(Program).Assembly)
            .AddFluentValidation()
            .AddGrpcClients(configuration)
            .AddServiceBootstrapping(configuration)
            .Configure<FormOptions>(options =>
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

                //jwtOptions.MapInboundClaims = false;
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

            config.UsingRabbitMq((context, configurator) =>
            {
                configurator.Host(new Uri(configuration.GetConnectionString("messaging")!));
                configurator.ConfigureEndpoints(context);
                configurator.UseRawJsonDeserializer(isDefault: true);
            });
        });
        //services.AddHostedService<Worker>();

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
        services.AddAntiforgery();

        return services;
    }
}
