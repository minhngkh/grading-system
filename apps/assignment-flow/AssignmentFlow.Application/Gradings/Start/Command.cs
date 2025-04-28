using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.Start;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required TeacherId TeacherId { get; init; }
    public required string RubricId { get; init; }
    public required List<CriterionAttachmentsSelector> CriterionAttachmentsSelectors { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.StartGrading(command);

        return Task.CompletedTask;
    }
}
