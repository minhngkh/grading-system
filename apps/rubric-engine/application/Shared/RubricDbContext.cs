using Microsoft.EntityFrameworkCore;
using RubricEngine.Application.Rubrics;

namespace RubricEngine.Application.Models;

public class RubricDbContext(DbContextOptions<RubricDbContext> options) : DbContext(options)
{
    public DbSet<Rubric> Rubrics => Set<Rubric>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(this.GetType().Assembly);
    }
}
