using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UpdateScaleFactor;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required ScaleFactor ScaleFactor { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.UpdateScaleFactor(command);

        return Task.CompletedTask;
    }
}
