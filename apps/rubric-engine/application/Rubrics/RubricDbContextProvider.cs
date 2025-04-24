using EventFlow.EntityFramework;
using Microsoft.EntityFrameworkCore;
using RubricEngine.Application.Models;

namespace RubricEngine.Application.Rubrics;

public class RubricDbContextProvider : IDbContextProvider<RubricDbContext>
{
    private readonly DbContextOptions<RubricDbContext> dbContextOptions;

    public RubricDbContextProvider(IConfiguration configuration)
    {
        this.dbContextOptions = new DbContextOptionsBuilder<RubricDbContext>()
            .UseNpgsql(configuration.GetConnectionString("rubricdb"))
            .Options;
    }

    public RubricDbContext CreateContext()
    {
        var context = new RubricDbContext(dbContextOptions);
        context.Database.Migrate();
        return context;
    }
}
