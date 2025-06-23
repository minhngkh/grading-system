using AssignmentFlow.IntegrationEvents;
using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.Assess;

[EventVersion("assessmentFailed", 1)]
public class AssessmentFailedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required GradingId GradingId { get; init; }
    public required Dictionary<string, string> Errors { get; init; }
}
