using EventFlow.Aggregates;
using EventFlow.Core;
using EventFlow.Extensions;
using RubricEngine.Application.Rubrics.Complete;
using RubricEngine.Application.Rubrics.Update;

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
        RubricCanBeUpdatedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        // All validations passed, emit the update event
        ConditionalEmit(command.Name is not null,
            () => new RubricInfoUpdatedEvent
            {
                Name = command.Name!
            });

        ConditionalEmit(command.PerformanceTags is not null,
            () => new PerformanceTagsUpdatedEvent
            {
                PerformanceTags = command.PerformanceTags!
            });

        ConditionalEmit(command.Criteria is not null,
            () => new CriteriaUpdatedEvent
            {
                Criteria = command.Criteria!
            });
    }

    public void CompleteRubric(Rubrics.Complete.Command command)
    {
        RubricCanBeMarkedAsUsedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);
        Emit(new Complete.RubricUsedEvent
        {
            GradingId = command.GradingId
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
