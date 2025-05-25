using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingSagaWriteModel :
    AggregateState<GradingSaga, GradingSagaId, GradingSagaWriteModel>,
    IEventApplier<GradingSaga, GradingSagaId>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public Shared.GradingId GradingId { get; private set; } = Shared.GradingId.Empty;
    public RubricId RubricId { get; private set; } = RubricId.Empty;
    public List<Shared.AssessmentId> AssessmentIds { get; private set; } = [];

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