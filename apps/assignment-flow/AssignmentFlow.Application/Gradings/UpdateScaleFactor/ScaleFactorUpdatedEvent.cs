using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.UpdateScaleFactor;

[EventVersion("scaleFactorUpdated", 1)]
public class ScaleFactorUpdatedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required ScaleFactor ScaleFactor { get; set; }
}