using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

[EventVersion("criterionAssessed", 1)]
public class CriterionAssessedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required ScoreBreakdownItem ScoreBreakdownItem { get; init; }
    public List<Feedback> Feedbacks { get; init; } = [];
}
