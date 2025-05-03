using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

public sealed class RubricId : StringValueObject
{
    public static RubricId Empty => new();
    private RubricId() { }

    [JsonConstructor]
    public RubricId(string value) : base(value) { }

    public static RubricId New(string value) => new(value);
}