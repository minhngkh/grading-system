using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.Create;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required TeacherId TeacherId { get; init; }
    public required string Reference { get; init; }
    public required ScaleFactor ScaleFactor { get; init; }
    public RubricId? RubricId { get; init; }
    public GradingName? Name { get; init; }
}

public class CommandHandler : CommandHandler<GradingAggregate, GradingId, Command>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.CreateGrading(command);

        if (command.RubricId is not null)
        {
            aggregate.ChangeRubric(command.RubricId);
        }

        return Task.CompletedTask;
    }
}
