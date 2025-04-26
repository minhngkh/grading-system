using AssignmentFlow.Application.Submissions;
using EventFlow.Aggregates;
namespace AssignmentFlow.Application.Assessments;

public class AssessmentWriteModel
    : AggregateState<AssessmentAggregate, AssessmentId, AssessmentWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;

    public ScoreBreakdowns ScoreBreakdowns { get; private set; } = ScoreBreakdowns.Empty;
}
