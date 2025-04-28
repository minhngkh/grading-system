using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

[EventVersion("submissionAdded", 1)]
public class SubmissionAddedEvent(Uri uri) : AggregateEvent<GradingAggregate, GradingId>
{
    public Uri Uri { get; init; } = uri;
}
