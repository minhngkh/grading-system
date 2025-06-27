using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

[EventVersion("assessmentAutoGradingFinished", 1)]
public class AutoGradingFinishedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required GradingId GradingId { get; init; }
}
