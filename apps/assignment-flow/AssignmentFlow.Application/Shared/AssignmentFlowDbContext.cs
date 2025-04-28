using AssignmentFlow.Application.Gradings;
using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Shared;

public class AssignmentFlowDbContext(DbContextOptions<AssignmentFlowDbContext> options) : DbContext(options)
{
    public DbSet<Grading> Gradings => Set<Grading>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);
    }
}
