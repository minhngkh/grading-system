using EventFlow.ValueObjects;
using RubricEngine.Application.Protos;

namespace AssignmentFlow.Application.Shared;

public class Criterion : ValueObject
{
    public string Name { get; init; } = string.Empty;
    public string Plugin { get; init; } = "None";
    public decimal Weight { get; init; } = 0m;

    public static Criterion Parse(CriterionModel criterionModel)
        => new()
        {
            Name = criterionModel.Name,
            Plugin = criterionModel.Plugin,
            Weight = (decimal) criterionModel.Weight
        };

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Name;
        yield return Plugin;
        yield return Weight;
    }
}
