using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AssessCriterion;

[EventVersion("criterionAssessed", 1)]
public class CriterionAssessedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required ScoreBreakdownItem ScoreBreakdownItem { get; init; }
}
