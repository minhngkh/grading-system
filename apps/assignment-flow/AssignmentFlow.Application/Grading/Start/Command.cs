using EventFlow.Commands;

namespace AssignmentFlow.Application.Grading.Start;

public class Command(GradingId id) : Command<GradingAggregate, GradingId>(id)
{
    public required TeacherId TeacherId { get; init; }
    public string RubricId { get; init; } = string.Empty;
    public List<CriteriaFilesMapping> CriteriaFilesMappings { get; set; } = [];
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
