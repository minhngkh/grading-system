using EventFlow.Specifications;

namespace RubricEngine.Application.Rubrics.Update;

public class RubricCanBeUpdatedSpecification : Specification<RubricWriteModel>
{
    public static ISpecification<RubricWriteModel> New() => new RubricCanBeUpdatedSpecification();

    protected override IEnumerable<string> IsNotSatisfiedBecause(RubricWriteModel rubric)
    {
        /// If you edit a rubric, the changes apply only to the assignment you're in.
        /// After you start grading, you can't edit or delete the assignment's rubric.
        if (rubric.Status == RubricStatus.Used.ToString())
        {
            yield return "Rubric cannot be updated after grading has started.";
        }
    }
}
