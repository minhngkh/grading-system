using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

public sealed class CriterionName : StringValueObject
{
    public static CriterionName Empty => new();
    private CriterionName() { }
    [JsonConstructor]
    public CriterionName(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static CriterionName New(string value) => new(value);
}
