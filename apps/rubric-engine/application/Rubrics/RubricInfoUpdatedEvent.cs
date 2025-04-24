using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics;

[EventVersion("rubricInfoUpdated", 1)]
public class RubricInfoUpdatedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required RubricName Name { get; init; }
}
