using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

[EventVersion("submissionAdded", 1)]
public class SubmissionAddedEvent(List<Submission> submissions) : AggregateEvent<GradingAggregate, GradingId>
{
    public List<Submission> Submissions { get; init; } = submissions;
}
