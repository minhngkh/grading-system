using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class AssessCriterionCommand(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required ScoreBreakdownItem ScoreBreakdownItem { get; init; }
    public List<Feedback> Feedbacks { get; init; } = [];
}

public class AssessCriterionCommandHandler()
    : CommandHandler<AssessmentAggregate, AssessmentId, AssessCriterionCommand>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, AssessCriterionCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
        {
            throw new InvalidOperationException($"Cannot assess assessment {aggregate.Id} because it has not been created yet.");
        }

        aggregate.Assess(command);
        aggregate.FinishAutoGrading();

        return Task.CompletedTask;
    }
}

public class FinishAutoGradingCommand(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
}

public class FinishAutoGradingCommandHandler()
    : CommandHandler<AssessmentAggregate, AssessmentId, FinishAutoGradingCommand>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, FinishAutoGradingCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
        {
            return Task.CompletedTask;
        }

        aggregate.FinishAutoGrading();
        return Task.CompletedTask;
    }
}
