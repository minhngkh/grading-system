using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.ChangeRubric;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required RubricId Rubric { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.ChangeRubric(command);

        return Task.CompletedTask;
    }
}
