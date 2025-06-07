using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.RemoveSubmission;

[EventVersion("submissionRemoved", 1)]
public class SubmissionRemovedEvent : AggregateEvent<GradingAggregate, GradingId>
{
    public required SubmissionReference RemovedSubmission { get; init; }
}
