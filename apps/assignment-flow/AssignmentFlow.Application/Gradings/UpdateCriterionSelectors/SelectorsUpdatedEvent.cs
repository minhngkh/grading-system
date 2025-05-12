using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;

[EventVersion("selectorsUpdated", 1)]
public class SelectorsUpdatedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public List<Selector> Selectors { get; set; } = [];
}