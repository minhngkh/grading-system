using EventFlow.Specifications;

namespace RubricEngine.Application.Rubrics.Complete;

public class RubricCanBeMarkedAsUsedSpecification : Specification<RubricWriteModel>
{
    public static ISpecification<RubricWriteModel> New() => new RubricCanBeMarkedAsUsedSpecification();

    protected override IEnumerable<string> IsNotSatisfiedBecause(RubricWriteModel rubric)
    {
        if (rubric.Status == RubricStatus.Used.ToString())
        {
            yield return"Rubric is already marked as used.";
        }

        if (rubric.Criteria.Count == 0)
        {
            yield return "Rubric must have at least one criterion.";
        }

        if (rubric.Criteria.Any(criterion => criterion.Levels.Count == 0))
        {
            yield return "All criteria must have at least one level.";
        }
    }
}
