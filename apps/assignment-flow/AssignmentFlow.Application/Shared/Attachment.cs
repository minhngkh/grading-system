using System.Text.Json.Serialization;

namespace AssignmentFlow.Application.Shared;

public sealed class Attachment : StringValueObject
{
    public static Attachment Empty => new();
    private Attachment() { }

    [JsonConstructor]
    public Attachment(string value) : base(value) { }

    protected override int? MaxLength => ModelConstants.VeryLongText;

    public static Attachment New(string value) => new(value);
}