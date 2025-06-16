using EventFlow.Specifications;

namespace AssignmentFlow.Application.Gradings.Start;

public sealed class AutoGradingCanBeFinishedSpecification : Specification<GradingWriteModel>
{
    private AutoGradingCanBeFinishedSpecification() { }
    public static AutoGradingCanBeFinishedSpecification New() => new ();
    protected override IEnumerable<string> IsNotSatisfiedBecause(GradingWriteModel obj)
    {
        if (!obj.StateMachine.CanFire(GradingTrigger.FinishGrading))
        {
            yield return $"grading is in state {Enum.GetName(obj.StateMachine.State)}";
        }
    }
}
