using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace AssignmentFlow.Application.Assessments.UpdateFeedBack;

[EventVersion("feedbacksUpdatedEvent", 1)]
public class FeedbacksUpdatedEvent : AggregateEvent<AssessmentAggregate, AssessmentId>
{
    public List<Feedback> Feedbacks { get; init; } = [];
}
