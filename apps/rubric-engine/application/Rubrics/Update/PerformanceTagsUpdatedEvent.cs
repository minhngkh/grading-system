using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics.Update;

[EventVersion("performanceTagsUpdated", 1)]
public class PerformanceTagsUpdatedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required List<PerformanceTag> PerformanceTags { get; init; }
}
