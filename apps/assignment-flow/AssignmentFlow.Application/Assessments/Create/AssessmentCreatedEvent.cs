using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.Create;

[EventVersion("assessmentCreated", 1)]
public class AssessmentCreatedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required SubmissionReference SubmissionReference { get; init; }
    public required GradingId GradingId { get; init; }
    public required TeacherId TeacherId { get; init; }
    public required RubricId RubricId { get; init; }
    public required HashSet<Criterion> Criteria { get; init; }

    public required int Total { get; init; }
}
