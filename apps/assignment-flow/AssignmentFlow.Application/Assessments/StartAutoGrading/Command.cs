using EventFlow.Commands;
namespace AssignmentFlow.Application.Assessments.StartAutoGrading;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
}

public class CommandHandler : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.StartAutoGrading();
        return Task.CompletedTask;
    }
}