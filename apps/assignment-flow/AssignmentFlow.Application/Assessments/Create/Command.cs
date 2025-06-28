using EventFlow.Commands;
namespace AssignmentFlow.Application.Assessments.Create;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required SubmissionReference SubmissionReference { get; init; }
    public required GradingId GradingId { get; init; }
    public required TeacherId TeacherId { get; init; }
    public required RubricId RubricId { get; init; }

    public HashSet<CriterionName> Criteria { get; init; } = [];
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
