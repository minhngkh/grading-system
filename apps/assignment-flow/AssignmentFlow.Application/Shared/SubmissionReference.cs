using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

public sealed class SubmissionReference : StringValueObject
{
    public static SubmissionReference Empty => new("");
    [JsonConstructor]
    public SubmissionReference(string value) : base(value) { }
    protected override bool AllowEmpty => true;
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static SubmissionReference New(string value) => new(value);
}
