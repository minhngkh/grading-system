using EventFlow.Aggregates;
using EventFlow.EventStores;
using RubricEngine.Application.Shared;

namespace RubricEngine.Application.Rubrics;

[EventVersion("rubricCreated", 1)]
public class RubricCreatedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required TeacherId TeacherId { get; init; }
    public required RubricName Name { get; init; }
}
