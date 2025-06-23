using EventFlow.Aggregates;
using EventFlow.EventStores;

namespace RubricEngine.Application.Rubrics.ProvisionContext;

[EventVersion("attachmentsProvisioned", 1)]
public class AttachmentsProvisionedEvent : AggregateEvent<RubricAggregate, RubricId>
{
    public required List<string> Attachments { get; set; }
}
