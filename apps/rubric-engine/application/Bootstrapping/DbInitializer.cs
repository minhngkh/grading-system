using System;
using System.Threading;
using System.Threading.Tasks;
using EventFlow.PostgreSql;
using EventFlow.PostgreSql.EventStores;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RubricEngine.Application.Models;

namespace RubricEngine.Application.Bootstrapping;

public class DbInitializer(
    RubricDbContext dbContext,
    IPostgreSqlDatabaseMigrator databaseMigrator,
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

            await EventFlowEventStoresPostgreSql.MigrateDatabaseAsync(databaseMigrator, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database initialization error");
        }
    }
}