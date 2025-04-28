using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Grading;

public class GradingWriteModel : AggregateState<GradingAggregate, GradingId, GradingWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public List<CriteriaFilesMapping> CriteriaFilesMappings { get; private set; } = [];

    internal void Apply(Start.GradingStartedEvent @event)
    {
        TeacherId = @event.TeacherId;
        CriteriaFilesMappings = @event.CriteriaFilesMappings;
    }
}