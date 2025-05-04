using AssignmentFlow.Application.Shared;
using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents an attachment associated with feedback that can be used to highlight content in a document.
/// </summary>
[JsonConverter(typeof(FeedbackAttachmentConverter))]
public sealed class FeedbackAttachment : ValueObject
{
    public Attachment Attachment { get; private set; }

    /// <summary>
    /// Gets the location information for the attachment within a document.
    /// </summary>
    public DocumentLocation Location { get; private set; }
    
    public FeedbackAttachment(Attachment attachment, DocumentLocation location)
    {
        Attachment = attachment;
        Location = location;
    }
    
    /// <summary>
    /// Initializes a new instance of the <see cref="FeedbackAttachment"/> class.
    /// </summary>
    /// <param name="attachment">The attachment to be associated with the feedback.</param>
    /// <param name="location">The location information for the attachment within a document.</param>
    public static FeedbackAttachment New(Attachment attachment, DocumentLocation location) =>
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

public sealed class FeedbackAttachmentConverter : JsonConverter<FeedbackAttachment>
{
    public override FeedbackAttachment? ReadJson(JsonReader reader, Type objectType, FeedbackAttachment? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var attachment = jObject.GetRequired<Attachment>("Attachment");
        var location = jObject.GetRequired<DocumentLocation>("Location");
        return FeedbackAttachment.New(attachment, location);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, FeedbackAttachment? value, JsonSerializer serializer) => throw new NotSupportedException();
}