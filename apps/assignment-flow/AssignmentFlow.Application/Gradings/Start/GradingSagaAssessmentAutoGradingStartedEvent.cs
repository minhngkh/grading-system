using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingSagaAssessmentAutoGradingStarted", 1)]
public class GradingSagaAssessmentAutoGradingStartedEvent : IAggregateEvent<GradingSaga, GradingSagaId>
{
    public required Shared.AssessmentId AssessmentId { get; init; }
}
