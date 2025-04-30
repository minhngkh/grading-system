using AssignmentFlow.Application.Shared;
using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingStarted", 1)]
public class GradingStartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required TeacherId TeacherId { get; init; }
    public required RubricId RubricId { get; init; }
    public required List<CriterionAttachmentsSelector> Selectors { get; init; }
}
