using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents an attachment associated with feedback that can be used to highlight content in a document.
/// </summary>
[JsonConverter(typeof(HighlightConverter))]
public sealed class Highlight : ValueObject
{
    public Attachment Attachment { get; private set; }

    /// <summary>
    /// Gets the location information for the attachment within a document.
    /// </summary>
    public DocumentLocation Location { get; private set; }
    
    public Highlight(Attachment attachment, DocumentLocation location)
    {
        Attachment = attachment;
        Location = location;
    }
    
    /// <summary>
    /// Initializes a new instance of the <see cref="Highlight"/> class.
    /// </summary>
    /// <param name="attachment">The attachment to be associated with the feedback.</param>
    /// <param name="location">The location information for the attachment within a document.</param>
    public static Highlight New(Attachment attachment, DocumentLocation location) =>
        new(attachment, location);
    
    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Attachment;
        yield return Location;
    }
}

public sealed class HighlightConverter : JsonConverter<Highlight>
{
    public override Highlight? ReadJson(JsonReader reader, Type objectType, Highlight? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var attachment = jObject.GetRequired<Attachment>("Attachment");
        var location = jObject.GetRequired<DocumentLocation>("Location");
        return Highlight.New(attachment, location);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, Highlight? value, JsonSerializer serializer) => throw new NotSupportedException();
}