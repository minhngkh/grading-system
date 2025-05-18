using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.Create;

[EventVersion("assessmentCreated", 1)]
public class AssessmentCreatedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required SubmissionReference SubmissionReference { get; init; }
    public required GradingId GradingId { get; init; }
    public required TeacherId TeacherId { get; init; }
}