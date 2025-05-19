using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentFlow.Application.Assessments;

public class AssessmentEntityTypeConfiguration : IEntityTypeConfiguration<Assessment>
{
    public void Configure(EntityTypeBuilder<Assessment> builder)
    {
        builder.OwnsMany(a => a.ScoreBreakdowns, sb => sb.ToJson());
        builder.OwnsMany(a => a.Feedbacks, sb => sb.ToJson());
    }
}

public class ScoreAdjustmentEntityTypeConfiguration : IEntityTypeConfiguration<ScoreAdjustment>
{
    public void Configure(EntityTypeBuilder<ScoreAdjustment> builder)
    {
        builder.OwnsMany(sa => sa.ScoreBreakdowns, sb => sb.ToJson());
        builder.OwnsMany(sa => sa.DeltaScoreBreakdowns, sb => sb.ToJson());
    }
}
