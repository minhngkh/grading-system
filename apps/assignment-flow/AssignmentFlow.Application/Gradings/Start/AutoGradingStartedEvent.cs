using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("autoGradingStarted", 1)]
public class AutoGradingStartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
}
