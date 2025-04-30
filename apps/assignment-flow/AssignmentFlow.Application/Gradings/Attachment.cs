using System.Text.Json.Serialization;

namespace AssignmentFlow.Application.Gradings;

public sealed class Attachment : StringValueObject
{
    public static Attachment Empty => new();
    private Attachment() { }

    [JsonConstructor]
    public Attachment(string value) : base(value) { }

    public static Attachment New(string value) => new(value);
}