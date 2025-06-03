using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents feedback associated with a score breakdown item.
/// </summary>
[JsonConverter(typeof(FeedbackConverter))]
public sealed class Feedback : ValueObject
{
    public CriterionName Criterion { get; private set; }
    /// <summary>
    /// Gets the comment associated with the feedback.
    /// </summary>
    public Comment Comment { get; private set; }
    
    /// <summary>
    /// Gets the tag associated with the feedback, which indicates the type or category such as "info", "success", "notice", "tip", or "caution".
    /// </summary>
    public Tag Tag { get; private set; }

    /// <summary>
    /// Gets the attachments related to the feedback, used for highlighting or annotating content in documents.
    /// </summary>
    public Highlight Highlight { get; private set; }

    private Feedback(CriterionName criterion, Comment comment, Highlight highlight, Tag tag)
    {
        Criterion = criterion;
        Comment = comment;
        Highlight = highlight;
        Tag = tag;
    }

    public static Feedback New(CriterionName criterion, Comment comment, Highlight highlight, Tag tag)
        => new(criterion, comment, highlight, tag);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Criterion;
        yield return Comment;
        yield return Highlight;
        yield return Tag;
    }
}

public sealed class FeedbackConverter : JsonConverter<Feedback>
{
    public override Feedback? ReadJson(JsonReader reader, Type objectType, Feedback? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var criterion = jObject.GetRequired<CriterionName>("Criterion");
        var comment = jObject.GetRequired<Comment>("Comment");
        var attachment = jObject.GetRequired<Highlight>("Highlight");
        var tag = jObject.GetRequired<Tag>("Tag");
        return Feedback.New(criterion, comment, attachment, tag);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, Feedback? value, JsonSerializer serializer) => throw new NotSupportedException();
}


public sealed class Comment : StringValueObject
{
    public static Comment Empty => new();
    private Comment() { }
    [JsonConstructor]
    public Comment(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.VeryLongText;
    public static Comment New(string value) => new(value);
}

public sealed class Tag : StringValueObject
{
    public static Tag Empty => new();
    private static Tag Info => new("info");
    private static Tag Success => new("success");
    private static Tag Notice => new("notice");
    private static Tag Tip => new("tip");
    private static Tag Caution => new("caution");
    private Tag() { }

    [JsonConstructor]
    public Tag(string value) : base(GetPredefinedTagOrThrow(value))
    {
    }

    private static string GetPredefinedTagOrThrow(string value)
        => value switch
        {
            "info" => value,
            "success" => value,
            "notice" => value,
            "tip" => value,
            "caution" => value,
            _ when string.IsNullOrEmpty(value) => value, //TODO: look at this
            _ => throw new ArgumentException("Invalid tag value", nameof(value)),
        };
    
    protected override int? MaxLength => ModelConstants.TinyText;
    public static Tag New(string value) => new(value);
}
