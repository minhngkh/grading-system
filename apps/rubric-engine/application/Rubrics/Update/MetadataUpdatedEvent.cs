using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics.Update;

[EventVersion("metadataUpdated", 1)]
public class MetadataUpdatedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required string MetadataJson { get; init; }
}
