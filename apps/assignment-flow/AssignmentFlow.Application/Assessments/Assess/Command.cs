using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.Assess;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required ScoreBreakdowns ScoreBreakdowns { get; init; }
    public required Grader Grader { get; init; }
    public List<Feedback>? Feedbacks { get; init; } = null;
    public Dictionary<string, string>? Errors { get; init; } = null;
}

public class CommandHandler()
    : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
        {
            throw new InvalidOperationException($"Cannot assess assessment {aggregate.Id} because it has not been created yet.");
        }

        aggregate.Assess(command);

        return Task.CompletedTask;
    }
}
