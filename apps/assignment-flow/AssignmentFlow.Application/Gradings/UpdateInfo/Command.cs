using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UpdateInfo;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required GradingName GradingName { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.UpdateInfo(command);

        return Task.CompletedTask;
    }
}
