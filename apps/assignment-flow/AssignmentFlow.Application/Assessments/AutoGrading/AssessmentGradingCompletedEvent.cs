using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

[EventVersion("assessmentGradingCompleted", 1)]
public class AssessmentGradingCompletedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
}
