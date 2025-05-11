using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required List<Selector> Selectors { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.UpdateSelectors(command);

        return Task.CompletedTask;
    }
}
