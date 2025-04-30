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
    /// <summary>
    /// Gets the reference identifier for the attachment.
    /// </summary>
    public string ReferenceId { get; private set; }

    /// <summary>
    /// Gets the type of attachment (e.g., "Highlight", "Comment", "Annotation").
    /// </summary>
    public string Type { get; private set; }

    /// <summary>
    /// Gets the location information for the attachment within a document.
    /// </summary>
    public DocumentLocation Location { get; private set; }

    /// <summary>
    /// Gets additional metadata for the attachment.
    /// </summary>
    public HighlightMetadata Metadata { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="FeedbackAttachment"/> class.
    /// </summary>
    /// <param name="referenceId">The reference identifier for the attachment.</param>
    /// <param name="type">The type of attachment.</param>
    /// <param name="location">The location information for the attachment.</param>
    /// <param name="metadata">Additional metadata for the attachment.</param>
    public FeedbackAttachment(string referenceId, string type, DocumentLocation location, HighlightMetadata? metadata = null)
    {
        ReferenceId = referenceId;
        Type = type;
        Location = location;
        Metadata = metadata ?? HighlightMetadata.Empty;
    }

    /// <summary>
    /// Creates a new instance of <see cref="FeedbackAttachment"/>.
    /// </summary>
    /// <param name="referenceId">The reference identifier for the attachment.</param>
    /// <param name="type">The type of attachment.</param>
    /// <param name="location">The location information for the attachment.</param>
    /// <param name="metadata">Additional metadata for the attachment.</param>
    /// <returns>A new <see cref="FeedbackAttachment"/> instance.</returns>
    public static FeedbackAttachment New(string referenceId, string type, DocumentLocation location, HighlightMetadata? metadata = null) =>
        new(referenceId, type, location, metadata);

    /// <summary>
    /// Creates a highlight attachment for a document with the specified location.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="fromLine">Starting line number (0-based).</param>
    /// <param name="toLine">Ending line number (0-based).</param>
    /// <param name="fromCol">Starting column number (0-based).</param>
    /// <param name="toCol">Ending column number (0-based).</param>
    /// <param name="metadata">Optional highlight metadata.</param>
    /// <returns>A new <see cref="FeedbackAttachment"/> configured as a document highlight.</returns>
    public static FeedbackAttachment CreateHighlight(
        string documentId, 
        int fromLine, 
        int toLine, 
        int fromCol, 
        int toCol,
        HighlightMetadata? metadata = null)
    {
        var location = DocumentLocation.New(documentId, fromLine, toLine, fromCol, toCol);
        return New(documentId, "Highlight", location, metadata);
    }

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return ReferenceId;
        yield return Type;
        yield return Location;
        yield return Metadata;
    }
}

public sealed class FeedbackAttachmentConverter : JsonConverter<FeedbackAttachment>
{
    public override FeedbackAttachment? ReadJson(JsonReader reader, Type objectType, FeedbackAttachment? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var referenceId = jObject.GetRequired<string>("ReferenceId");
        var type = jObject.GetRequired<string>("Type");
        var location = jObject.GetRequired<DocumentLocation>("Location");
        var metadata = jObject.Get<HighlightMetadata>("Metadata");
        return FeedbackAttachment.New(referenceId, type, location, metadata);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, FeedbackAttachment? value, JsonSerializer serializer) => throw new NotSupportedException();
}