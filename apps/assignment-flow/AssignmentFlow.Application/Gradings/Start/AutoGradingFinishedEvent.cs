using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("autoGradingFinished", 1)]
public class AutoGradingFinishedEvent : AggregateEvent<GradingAggregate, GradingId>
{
}
