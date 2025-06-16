using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.Start;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(
        GradingAggregate aggregate,
        Command command,
        CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.StartAutoGrading();
        return Task.CompletedTask;
    }
}
