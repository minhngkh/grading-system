using Newtonsoft.Json;

namespace AssignmentFlow.Application.Gradings;

public sealed class GradingName : StringValueObject
{
    public static GradingName Empty => new();
    private GradingName() { }
    [JsonConstructor]
    public GradingName(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.MediumText;
    protected override bool AllowEmpty => true;
    public static GradingName New(string value) => new(value);
}
