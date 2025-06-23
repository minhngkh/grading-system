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
    public string LocationDataJson { get; private set; } = string.Empty;

    public Highlight(Attachment attachment, string locationDataJson)
    {
        Attachment = attachment;
        LocationDataJson = locationDataJson;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="Highlight"/> class.
    /// </summary>
    /// <param name="attachment">The attachment to be associated with the feedback.</param>
    /// <param name="locationDataJson">The location data in JSON format for the attachment within a document.</param>
    public static Highlight New(Attachment attachment, string locationDataJson) =>
        new(attachment, locationDataJson);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Attachment;
        yield return LocationDataJson;
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
        var locationDataJson = jObject.GetRequired<string>("LocationDataJson");
        return Highlight.New(attachment, locationDataJson);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, Highlight? value, JsonSerializer serializer) => throw new NotSupportedException();
}
