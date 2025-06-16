using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.StartAutoGrading;

[EventVersion("assessmentAutoGradingStarted", 1)]
public class AutoGradingStartedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required GradingId GradingId { get; init; }
}
