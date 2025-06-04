using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingAutoGradingStarted", 1)]
public class AutoGradingStartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
}
