using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingSagaAssessmentTracked", 1)]
public class GradingSagaAssessmentTrackedEvent : IAggregateEvent<GradingSaga, GradingSagaId>
{
    public required SubmissionReference SubmissionReference { get; init; }
    public required Shared.AssessmentId AssessmentId { get; init; }
}
