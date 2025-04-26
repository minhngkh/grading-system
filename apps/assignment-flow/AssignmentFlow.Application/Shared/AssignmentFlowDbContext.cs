using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Shared;

public class AssignmentFlowDbContext(DbContextOptions<AssignmentFlowDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);
    }
}
