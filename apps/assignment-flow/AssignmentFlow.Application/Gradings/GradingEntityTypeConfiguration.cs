using AssignmentFlow.Application.Gradings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace RubricEngine.Application.Rubrics;

public class GradingEntityTypeConfiguration : IEntityTypeConfiguration<Grading>
{
    public void Configure(EntityTypeBuilder<Grading> builder)
    {
        builder
            .OwnsMany(r => r.CriterionAttachmentsSelectors, c =>
            {
                c.ToJson();
                c.OwnsOne(c => c.Selector, cc => cc.ToJson());
            });
    }
}
