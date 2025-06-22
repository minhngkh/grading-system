using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingAutoGradingStarted", 1)]
public class AutoGradingStartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
}

[EventVersion("gradingAutoGradingRestarted", 1)]
public class AutoGradingRestartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
}
