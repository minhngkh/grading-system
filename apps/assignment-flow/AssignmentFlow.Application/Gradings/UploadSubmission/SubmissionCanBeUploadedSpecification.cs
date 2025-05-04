using EventFlow.Specifications;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public class SubmissionCanBeUploadedSpecification : Specification<GradingWriteModel>
{
    public static ISpecification<GradingWriteModel> New() => new SubmissionCanBeUploadedSpecification();
    protected override IEnumerable<string> IsNotSatisfiedBecause(GradingWriteModel obj)
    {
        if (!obj.StateMachine.CanFire(GradingTrigger.UploadSubmission))
        {
            yield return $"grading is in state {Enum.GetName(obj.StateMachine.State)}";
        }
    }
}
