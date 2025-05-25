using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.ChangeRubric;

[EventVersion("rubricChanged", 1)]
public class RubricChangedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required RubricId RubricId { get; set; }
}