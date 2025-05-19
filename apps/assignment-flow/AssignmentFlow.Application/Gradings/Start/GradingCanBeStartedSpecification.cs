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

        if (obj.RubricId == RubricId.Empty)
        {
            yield return $"rubric is not selected";
        }

        if (obj.Submissions.Count == 0)
        {
            yield return $"no submissions are uploaded";
        }

        if (obj.Selectors.Count == 0)
        {
            yield return $"no selectors are defined";
        }
    }
}
