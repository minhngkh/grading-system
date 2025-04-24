using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace RubricEngine.Application.Rubrics;

public class RubricEntityTypeConfiguration : IEntityTypeConfiguration<Rubric>
{
    public void Configure(EntityTypeBuilder<Rubric> builder)
    {
        builder
            .OwnsMany(r => r.Criteria, c =>
            {
                c.ToJson();
                c.OwnsMany(c => c.Levels);
            });
    }
}
