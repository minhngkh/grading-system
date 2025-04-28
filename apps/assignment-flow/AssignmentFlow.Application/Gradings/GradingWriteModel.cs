using AssignmentFlow.Application.Gradings.Start;
using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingWriteModel : AggregateState<GradingAggregate, GradingId, GradingWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public List<CriterionAttachmentsSelector> CriteriaFilesMappings { get; private set; } = [];

    internal void Apply(GradingStartedEvent @event)
    {
        TeacherId = @event.TeacherId;
        CriteriaFilesMappings = @event.Selectors;
    }
}