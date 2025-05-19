using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

public sealed class GradingId : StringValueObject
{
    public static GradingId Empty => new();
    private GradingId() { }

    [JsonConstructor]
    public GradingId(string value) : base(value) { }

    protected override bool AllowEmpty => true;
    public static GradingId With(string value) => new(value);
}
