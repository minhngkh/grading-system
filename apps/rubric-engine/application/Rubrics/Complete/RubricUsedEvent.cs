using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics.Complete;

[EventVersion("rubricUsed", 1)]
internal class RubricUsedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required string GradingId { get; set; }
}