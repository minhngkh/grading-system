using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingSagaStartedEvent : AggregateEvent<GradingSaga, GradingSagaId>
{
    public required TeacherId TeacherId { get; init; }
    public required Shared.GradingId GradingId { get; init; }
    public required RubricId RubricId { get; init; }
}