using EventFlow.Specifications;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

public sealed class AutoGradingCanBeFinishedSpecification : Specification<AssessmentWriteModel>
{
    private AutoGradingCanBeFinishedSpecification() { }
    public static AutoGradingCanBeFinishedSpecification New() => new ();
    protected override IEnumerable<string> IsNotSatisfiedBecause(AssessmentWriteModel obj)
    {
        if (!obj.ScoreBreakdowns.IsComplete())
        {
            yield return "score breakdowns are not complete";
        }

        if (!obj.StateMachine.CanFire(AssessmentTrigger.FinishAutoGrading))
        {
            yield return $"assessment is in state {Enum.GetName(obj.StateMachine.State)}";
        }
    }
}
