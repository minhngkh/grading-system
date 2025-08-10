using EventFlow.Commands;
using EventFlow.Jobs;
using EventFlow.Provided.Jobs;
namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class StartAutoGradingCommand(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id);

public class StartAutoGradingCommandHandler(IServiceProvider serviceProvider) : CommandHandler<AssessmentAggregate, AssessmentId, StartAutoGradingCommand>
{
    public override async Task ExecuteAsync(AssessmentAggregate aggregate, StartAutoGradingCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return;

        aggregate.StartAutoGrading();

        var jobScheduler = serviceProvider.GetService<IJobScheduler>();
        var job = PublishCommandJob.Create(new CancelAutoGradingCommand(aggregate.Id), serviceProvider);
        await jobScheduler.ScheduleAsync(
            job,
            TimeSpan.FromMinutes(4), // Cancel auto-grading after 4 minutes
            CancellationToken.None)
            .ConfigureAwait(false);
    }
}
