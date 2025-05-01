using AssignmentFlow.Application.GradingSaga;
using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.Create;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required TeacherId TeacherId { get; init; }
    public required GradingSagaId GradingId { get; init; }
    public required SubmissionReference Reference { get; init; }
}