using EventFlow.EntityFramework;
using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Shared;

public class AssignmentFlowDbContextProvider : IDbContextProvider<AssignmentFlowDbContext>
{
    private readonly DbContextOptions<AssignmentFlowDbContext> dbContextOptions;

    public AssignmentFlowDbContextProvider(IConfiguration configuration)
    {
        dbContextOptions = new DbContextOptionsBuilder<AssignmentFlowDbContext>()
            .UseNpgsql(configuration.GetConnectionString("assignmentflowdb"))
            .Options;
    }

    public AssignmentFlowDbContext CreateContext()
    {
        var context = new AssignmentFlowDbContext(dbContextOptions);
        context.Database.Migrate();
        return context;
    }
}
