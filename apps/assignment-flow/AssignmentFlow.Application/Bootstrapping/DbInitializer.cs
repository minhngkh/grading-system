﻿using Azure.Storage.Blobs;
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

            logger.LogDebug("Ensuring blob container for submissions store exists...");
            var containerClient = blobServiceClient.GetBlobContainerClient("submissions-store");
            var containerExists = await containerClient.ExistsAsync();
            if (!containerExists.Value)
            {
                logger.LogDebug("Creating blob container for submissions store...");
                await containerClient.CreateAsync();
                logger.LogDebug("Blob container created successfully.");
            }
            else
            {
                logger.LogDebug("Blob container 'submissions-store' already exists.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database initialization error");
        }
    }
}