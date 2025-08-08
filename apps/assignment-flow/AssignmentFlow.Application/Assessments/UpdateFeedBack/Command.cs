using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.UpdateFeedBack;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public List<Feedback> Feedbacks { get; init; } = [];
}

public class CommandHandler()
    : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
        {
            throw new InvalidOperationException($"Cannot update feedbacks for assessment {aggregate.Id} because it has not been created yet.");
        }
        aggregate.UpdateFeedbacks(command);
        return Task.CompletedTask;
    }
}
