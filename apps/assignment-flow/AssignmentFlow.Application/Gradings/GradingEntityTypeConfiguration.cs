using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentFlow.Application.Gradings;

public class GradingEntityTypeConfiguration : IEntityTypeConfiguration<Grading>
{
    public void Configure(EntityTypeBuilder<Grading> builder)
    {
        builder
            .OwnsMany(g => g.Selectors, s => s.ToJson());

        builder
            .OwnsMany(g => g.Submissions, s =>
            {
                s.ToJson();
                s.OwnsMany(s => s.CriteriaFiles);
            });
    }
}
