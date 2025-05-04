using EventFlow.Specifications;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingCanBeStartedSpecification : Specification<GradingWriteModel>
{
    public static ISpecification<GradingWriteModel> New() => new GradingCanBeStartedSpecification();
    protected override IEnumerable<string> IsNotSatisfiedBecause(GradingWriteModel obj)
    {
        if (!obj.StateMachine.CanFire(GradingTrigger.Start))
        {
            yield return $"grading is in state {Enum.GetName(obj.StateMachine.State)}";
        }
    }
}
