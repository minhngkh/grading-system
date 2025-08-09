using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

[EventVersion("assessmentAutoGradingStarted", 1)]
public class AutoGradingStartedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public required GradingId GradingId { get; init; }
    public required RubricId RubricId { get; init; }
    public required SubmissionReference Reference { get; init; }
    public required ScoreBreakdowns InitialScoreBreakdowns { get; init; }
    public required int Total { get; init; }
}
