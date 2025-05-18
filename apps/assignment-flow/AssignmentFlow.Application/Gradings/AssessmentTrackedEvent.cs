using AssignmentFlow.Application.Assessments;
using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings;

[EventVersion("assessmentTracked", 1)]
public class AssessmentTrackedEvent : IAggregateEvent<GradingSaga, GradingSagaId>
{
    public required Shared.AssessmentId AssessmentId { get; init; }
}
