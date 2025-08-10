using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

[EventVersion("autoGradingCancelled", 1)]
public class AutoGradingCancelledEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required GradingId GradingId { get; init; }
}
