using EventFlow.Commands;
namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class StartAutoGradingCommand(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id);

public class StartAutoGradingCommandHandler : CommandHandler<AssessmentAggregate, AssessmentId, StartAutoGradingCommand>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, StartAutoGradingCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.StartAutoGrading();
        return Task.CompletedTask;
    }
}
