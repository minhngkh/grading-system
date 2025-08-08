using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.UpdateInfo;

[EventVersion("infoUpdated", 1)]
public class InfoUpdatedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required GradingName GradingName { get; set; }
}
