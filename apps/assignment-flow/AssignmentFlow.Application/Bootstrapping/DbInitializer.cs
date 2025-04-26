using AssignmentFlow.Application.Shared;
using Azure.Storage.Blobs;
using EventFlow.PostgreSql;
using EventFlow.PostgreSql.EventStores;
using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Bootstrapping;

public class DbInitializer(
    AssignmentFlowDbContext dbContext,
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

            logger.LogDebug("Creating blob container for submissions store...");
            await blobServiceClient.CreateBlobContainerAsync("submissions-store");
            logger.LogDebug("Blob container created successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database initialization error");
        }
    }
}