using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class CancelAutoGradingCommand(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
}

public class CancelAutoGradingCommandHandler : CommandHandler<AssessmentAggregate, AssessmentId, CancelAutoGradingCommand>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, CancelAutoGradingCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
        {
            return Task.CompletedTask;
        }
        aggregate.CancelAutoGrading();
        return Task.CompletedTask;
    }
}
