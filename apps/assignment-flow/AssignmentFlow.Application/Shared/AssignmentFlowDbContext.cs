using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Gradings;
using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Shared;

public class AssignmentFlowDbContext(DbContextOptions<AssignmentFlowDbContext> options) : DbContext(options)
{
    public DbSet<Grading> Gradings => Set<Grading>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<ScoreAdjustment> ScoreAdjustments => Set<ScoreAdjustment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(GetType().Assembly);
    }
}
