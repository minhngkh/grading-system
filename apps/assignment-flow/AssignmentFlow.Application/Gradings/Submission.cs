using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Gradings;

[JsonConverter(typeof(SubmissionConverter))]
public sealed class Submission : ValueObject
{
    public SubmissionReference Reference { get; }
    public List<Attachment> Attachments { get; }

    private Submission(SubmissionReference reference, List<Attachment> attachments)
    {
        Reference = reference;
        Attachments = attachments;
    }

    public static Submission New(SubmissionReference reference, List<Attachment> attachments)
        => new (reference, attachments);

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Reference;
        foreach (var attachment in Attachments)
        {
            yield return attachment;
        }
    }
}

public sealed class SubmissionConverter : JsonConverter<Submission>
{
    public override Submission? ReadJson(JsonReader reader, Type objectType, Submission? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        
        var jObject = JObject.Load(reader);
        var reference = jObject.GetRequired<SubmissionReference>("Reference");
        var attachments = jObject.GetRequired<List<Attachment>>("Attachments");

        return Submission.New(reference, attachments);
    }

    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, Submission? value, JsonSerializer serializer) => throw new NotSupportedException();
}