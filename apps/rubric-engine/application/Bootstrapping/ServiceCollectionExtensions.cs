using System.Reflection;
using FluentValidation;
using JsonApiDotNetCore.Configuration;
using JsonApiDotNetCore.Resources.Annotations;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using RubricEngine.Application.Models;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
namespace RubricEngine.Application.Bootstrapping;

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
            .AddServiceBootstrapping(configuration);

        services.AddGrpc();

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

            config.UsingAzureServiceBus((context, configurator) =>
            {
                configurator.Host(configuration.GetConnectionString("messaging"));
                configurator.ConfigureEndpoints(context);
            });
        });

        return services;
    }

    private static IServiceCollection AddProjectJsonApi(this IServiceCollection services, Assembly? assembly)
    {
        services.AddJsonApi<RubricDbContext>(
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

    private static IServiceCollection AddServiceBootstrapping(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddTransient<DbInitializer>();

        return services;
    }
}
