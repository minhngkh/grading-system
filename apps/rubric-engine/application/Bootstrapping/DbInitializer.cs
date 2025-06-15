using Azure.Storage.Blobs;
using EventFlow.PostgreSql;
using EventFlow.PostgreSql.EventStores;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RubricEngine.Application.Models;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace RubricEngine.Application.Bootstrapping;

public class DbInitializer(
    RubricDbContext dbContext,
    IPostgreSqlDatabaseMigrator databaseMigrator,
    BlobServiceClient blobServiceClient,
    ILogger<DbInitializer> logger)
{
    public async Task InitializeAsync(bool applyMigrations = true)
    {
        try
        {

            if (applyMigrations)
            {
                logger.LogDebug("Applying migrations to the database...");
                await dbContext.Database.MigrateAsync();
            }
            else
            {
                logger.LogDebug("Ensure database is created without running migrations.");
                await dbContext.Database.EnsureCreatedAsync();
            }

            logger.LogDebug("Applying migrations to the EventFlow event store...");
            await EventFlowEventStoresPostgreSql.MigrateDatabaseAsync(databaseMigrator, CancellationToken.None);
            logger.LogDebug("Database initialization completed successfully.");

            logger.LogDebug("Ensuring blob container for rubric context store exists...");
            var containerClient = blobServiceClient.GetBlobContainerClient("rubric-context-store");
            var containerExists = await containerClient.ExistsAsync();
            if (!containerExists.Value)
            {
                logger.LogDebug("Creating blob container for rubric context store...");
                await containerClient.CreateAsync();
                logger.LogDebug("Blob container created successfully.");
            }
            else
            {
                logger.LogDebug("Blob container 'rubric-context-store' already exists.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database initialization error");
        }
    }
}
