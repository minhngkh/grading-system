using EventFlow.Commands;
using RubricEngine.Application.Shared;

namespace RubricEngine.Application.Rubrics.Create;

public class Command : Command<RubricAggregate, RubricId>
{
    public Command(RubricId aggregateId, RubricName name, TeacherId teacherId)
        : base(aggregateId)
    {
        Name = name;
        TeacherId = teacherId;
    }
    public RubricName Name { get; }
    public TeacherId TeacherId { get; }
}

public class CommandHandler : CommandHandler<RubricAggregate, RubricId, Command>
{
    public override Task ExecuteAsync(RubricAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.Create(command);

        return Task.CompletedTask;
    }
}