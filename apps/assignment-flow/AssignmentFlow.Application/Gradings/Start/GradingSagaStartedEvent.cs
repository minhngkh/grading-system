using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSagaStartedEvent : AggregateEvent<GradingSaga, GradingSagaId>
{
    public required TeacherId TeacherId { get; init; }
    public required GradingId GradingId { get; init; }
    public required RubricId RubricId { get; init; }
    public HashSet<SubmissionReference> SubmissionReferences { get; init; } = [];
}
