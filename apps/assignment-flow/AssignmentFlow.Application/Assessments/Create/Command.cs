using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.Create;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required ScoreBreakdowns ScoreBreakdowns { get; init; }
    public required List<Feedback> Feedbacks { get; init; }
    public required SubmissionReference SubmissionReference { get; init; }
    public required string GradingId { get; init; }
    public required TeacherId TeacherId { get; init; }
}

public class CommandHandler : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (!aggregate.IsNew)
            return Task.CompletedTask;

        aggregate.CreateAssessment(command);

        return Task.CompletedTask;
    }
}