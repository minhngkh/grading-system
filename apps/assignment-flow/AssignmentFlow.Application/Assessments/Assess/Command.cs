using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.Assess;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required ScoreBreakdowns ScoreBreakdowns { get; init; }
    public List<Feedback>? Feedbacks { get; init; } = null;
    public required Grader Grader { get; init; }
}

public class CommandHandler : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.Assess(command);

        return Task.CompletedTask;
    }
}