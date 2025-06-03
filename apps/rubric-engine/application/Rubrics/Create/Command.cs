using EventFlow.Commands;

namespace RubricEngine.Application.Rubrics.Create;

public class Command : Command<RubricAggregate, RubricId>
{
    public Command(RubricId aggregateId, TeacherId teacherId)
        : base(aggregateId)
    {
        TeacherId = teacherId;
    }
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
