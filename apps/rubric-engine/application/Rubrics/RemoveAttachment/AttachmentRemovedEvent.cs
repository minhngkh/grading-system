using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics.RemoveAttachment;

[EventVersion("attachmentRemoved", 1)]
public class AttachmentRemovedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required string RemovedAttachment { get; init; }
}
