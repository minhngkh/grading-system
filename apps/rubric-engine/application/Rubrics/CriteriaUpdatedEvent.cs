using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics;

[EventVersion("criteriaUpdated", 1)]
public class CriteriaUpdatedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required List<Criterion> Criteria { get; init; }
}