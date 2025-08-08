using EventFlow.Aggregates;
using EventFlow.Core;
using EventFlow.Extensions;

namespace RubricEngine.Application.Rubrics;

public class RubricAggregate : AggregateRoot<RubricAggregate, RubricId>
{
    private readonly ILogger<RubricAggregate> logger;

    public TeacherId TeacherId => State.TeacherId;

    internal readonly RubricWriteModel State;

    public RubricAggregate(
        RubricId id,
        ILogger<RubricAggregate> logger)
        : base(id)
    {
        State = new RubricWriteModel();
        this.logger = logger;

        Register(State);
    }

    public void Create(Rubrics.Create.Command command)
    {
        Emit(new Create.RubricCreatedEvent
        {
            TeacherId = command.TeacherId,
        });
    }

    public void UpdateRubric(Rubrics.Update.Command command)
    {
        Update.RubricCanBeUpdatedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        // All validations passed, emit the update event
        ConditionalEmit(command.Name is not null,
            () => new Update.RubricInfoUpdatedEvent
            {
                Name = command.Name!
            });

        ConditionalEmit(command.PerformanceTags is not null,
            () => new Update.PerformanceTagsUpdatedEvent
            {
                PerformanceTags = command.PerformanceTags!
            });

        ConditionalEmit(command.Criteria is not null,
            () => new Update.CriteriaUpdatedEvent
            {
                Criteria = command.Criteria!
            });

        ConditionalEmit(command.Attachments is not null && command.Attachments.Count > 0,
            () => new ProvisionContext.AttachmentsProvisionedEvent
            {
                Attachments = command.Attachments!
            });

        ConditionalEmit(command.Metadata is not null,
            () => new Update.MetadataUpdatedEvent
            {
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(command.Metadata!) // Use the static JsonSerializer from System.Text.Json
            });
    }

    public void CompleteRubric(Complete.Command command)
    {
        Complete.RubricCanBeMarkedAsUsedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);
        Emit(new Complete.RubricUsedEvent
        {
            GradingId = command.GradingId
        });
    }

    public void ProvisionContext(List<string> attachments, Dictionary<string, object>? metadata = null)
    {
        //TODO: Create new specification
        Update.RubricCanBeUpdatedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new ProvisionContext.AttachmentsProvisionedEvent
        {
            Attachments = attachments,
        });

        ConditionalEmit(metadata is not null,
            () => new Update.MetadataUpdatedEvent
            {
                MetadataJson = System.Text.Json.JsonSerializer.Serialize(metadata) // Use the static JsonSerializer from System.Text.Json
            });
    }

    public void RemoveAttachment(string attachment)
    {
        Update.RubricCanBeUpdatedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new RemoveAttachment.AttachmentRemovedEvent
        {
            RemovedAttachment = attachment
        });
    }

    private void ConditionalEmit(bool condition, Func<AggregateEvent<RubricAggregate, RubricId>> eventPredicate)
    {
        if (condition)
        {
            Emit(eventPredicate());
        }
    }
}

public class RubricId(string id) : Identity<RubricId>(id) { }
