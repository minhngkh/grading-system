using EventFlow.Commands;

namespace RubricEngine.Application.Rubrics.Update;

public class Command(RubricId id) : Command<RubricAggregate, RubricId>(id)
{
    public RubricName? Name { get; init; }
    public List<PerformanceTag>? PerformanceTags { get; init; }
    public List<Criterion>? Criteria { get; init; }
}

public class CommandHandler : CommandHandler<RubricAggregate, RubricId, Command>
{
    public override Task ExecuteAsync(RubricAggregate aggregate, Command command,
        CancellationToken cancellationToken)
    {
        aggregate.UpdateRubric(command);
        return Task.CompletedTask;
    }
}