using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

[EventVersion("manualGradingRequested", 1)]
public class ManualGradingRequestedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
}
