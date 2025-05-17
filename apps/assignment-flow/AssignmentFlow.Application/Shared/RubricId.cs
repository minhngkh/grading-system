using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

public sealed class RubricId : StringValueObject
{
    public static RubricId Empty => new();
    private RubricId() { }

    [JsonConstructor]
    public RubricId(string value) : base(value) { }

    protected override bool AllowEmpty => true;
    public static RubricId With(string value) => new(value);
}