using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingStarted", 1)]
public class GradingStartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
}