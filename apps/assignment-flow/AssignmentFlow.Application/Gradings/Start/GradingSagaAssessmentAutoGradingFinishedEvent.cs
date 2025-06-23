using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.Start;

[EventVersion("gradingSagaAssessmentAutoGradingFinished", 1)]
public class GradingSagaAssessmentAutoGradingFinishedEvent : IAggregateEvent<GradingSaga, GradingSagaId>
{
    public required Shared.AssessmentId AssessmentId { get; init; }
}

[EventVersion("gradingSagaAssessmentAutoGradingFailed", 1)]
public class GradingSagaAssessmentAutoGradingFailedEvent : IAggregateEvent<GradingSaga, GradingSagaId>
{
    public required Shared.AssessmentId AssessmentId { get; init; }
}
