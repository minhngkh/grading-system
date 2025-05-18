using AssignmentFlow.Application.Assessments;
using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingSagaWriteModel :
    AggregateState<GradingSaga, GradingSagaId, GradingSagaWriteModel>,
    IEventApplier<GradingSaga, GradingSagaId>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public GradingId GradingId { get; private set; } = default!;
    public RubricId RubricId { get; private set; } = RubricId.Empty;
    public List<AssessmentId> AssessmentIds { get; private set; } = [];

    internal void Apply(GradingSagaStartedEvent e)
    {
        TeacherId = e.TeacherId;
        GradingId = e.GradingId;
        RubricId = e.RubricId;
    }

    internal void Apply(AssessmentTrackedEvent e)
    {
        AssessmentIds.Add(e.AssessmentId);
    }
}