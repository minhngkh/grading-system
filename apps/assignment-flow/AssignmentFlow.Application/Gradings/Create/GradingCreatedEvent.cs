using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Create;

[EventVersion("gradingCreated", 1)]
public class GradingCreatedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required TeacherId TeacherId { get; init; }
    public required string Reference { get; init; }
}
