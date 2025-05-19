using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

public sealed class AssessmentId : StringValueObject
{
    public static AssessmentId Empty => new();
    private AssessmentId() { }

    [JsonConstructor]
    public AssessmentId(string value) : base(value) { }

    protected override bool AllowEmpty => true;
    public static AssessmentId With(string value) => new(value);
}