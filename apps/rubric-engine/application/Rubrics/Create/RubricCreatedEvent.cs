using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics.Create;

[EventVersion("rubricCreated", 1)]
public class RubricCreatedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required TeacherId TeacherId { get; init; }
}
