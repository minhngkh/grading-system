using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.Assess;

[EventVersion("assessed", 1)]
public class AssessedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required ScoreBreakdowns ScoreBreakdowns { get; init; }
    public required List<Feedback> Feedbacks { get; init; }
}
