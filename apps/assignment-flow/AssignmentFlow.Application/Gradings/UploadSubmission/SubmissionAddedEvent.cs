using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

[EventVersion("submissionAdded", 1)]
public class SubmissionAddedEvent(Submission submission) : AggregateEvent<GradingAggregate, GradingId>
{
    public Submission Submission { get; init; } = submission;
}
