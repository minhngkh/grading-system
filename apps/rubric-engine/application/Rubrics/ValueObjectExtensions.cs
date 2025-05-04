namespace RubricEngine.Application.Rubrics;

public static class ValueObjectExtensions
{
    public static RubricName ToRubricName(this string name) => RubricName.New(name);

    public static List<PerformanceTag> ToPerformanceTags(this List<string> performamceTags) => [.. performamceTags.Select(PerformanceTag.New)];

    public static List<Criterion> ToCriteria(this List<CriterionApiContract> criteria) => [.. criteria.Select(x => x.ToCriterion())];

    public static Criterion ToCriterion(this CriterionApiContract criterion)
            => Criterion.New(CriterionName.New(criterion.Name), Percentage.New(criterion.Weight), criterion.Levels.ToPerformanceLevels());

    public static List<PerformanceLevel> ToPerformanceLevels(this List<PerformanceLevelApiContract> levels)
            => [.. levels.Select(x => PerformanceLevel.New(PerformanceTag.New(x.Tag), x.Description, Percentage.New(x.Weight)))];
}