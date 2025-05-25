using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.StartAutoGrading;

[EventVersion("autoGradingStarted", 1)]
public class AutoGradingStartedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
}
