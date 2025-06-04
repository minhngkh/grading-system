using EventFlow.Commands;

namespace AssignmentFlow.Application.Gradings.Start;

public sealed class CompleteAutoGradingCommand(GradingId gradingId) : Command<GradingAggregate, GradingId>(gradingId)
{
}

public sealed class CompleteAutoGradingCommandHandler() : CommandHandler<GradingAggregate, GradingId, CompleteAutoGradingCommand>
{
    public override Task ExecuteAsync(GradingAggregate aggregate, CompleteAutoGradingCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
        {
            throw new ArgumentException($"Grading {aggregate.Id.Value} doesn't exist.");
        }
        
        aggregate.CompleteAutoGrading();

        return Task.CompletedTask;
    }
}
