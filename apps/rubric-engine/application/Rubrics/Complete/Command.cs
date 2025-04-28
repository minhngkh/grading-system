using EventFlow.Commands;

namespace RubricEngine.Application.Rubrics.Complete;

public class Command(RubricId id) : Command<RubricAggregate, RubricId>(id)
{
    public required string GradingId { get; init; }
}

public class CommandHandler : CommandHandler<RubricAggregate, RubricId, Command>
{
    public override Task ExecuteAsync(RubricAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;
        aggregate.CompleteRubric(command);
        return Task.CompletedTask;
    }
}