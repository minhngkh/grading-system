using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.Create;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required TeacherId TeacherId { get; init; }
    public required string GradingId { get; init; }
    public required string SubmissionId { get; init; }
    public required ScoreBreakdowns ScoreBreakdowns { get; init; }
}

public class CommandHandler : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
}