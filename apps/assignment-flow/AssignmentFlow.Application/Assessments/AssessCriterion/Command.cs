using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.AssessCriterion;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required Grader Grader { get; init; }
    public required ScoreBreakdownItem ScoreBreakdownItem { get; init; }
    public List<Feedback> Feedbacks { get; init; } = [];
    public Dictionary<string, object?> Metadata { get; init; } = [];
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

        aggregate.AssessCriterion(command);

        return Task.CompletedTask;
    }
}
