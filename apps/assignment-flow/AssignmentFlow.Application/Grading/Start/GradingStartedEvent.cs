using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Grading.Start;

[EventVersion("gradingStarted", 1)]
public class GradingStartedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required TeacherId TeacherId { get; init; }
    public required string RubricId { get; init; }
    public required List<CriteriaFilesMapping> CriteriaFilesMappings { get; init; }
}
