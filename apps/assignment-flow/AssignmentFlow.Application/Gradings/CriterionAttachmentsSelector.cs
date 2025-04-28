using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Gradings;

[JsonConverter(typeof(CriterionAttachmentsSelectorConverter))]
public sealed class CriterionAttachmentsSelector : ValueObject
{
    public CriterionName Criterion { get; private set; }
    public ContentSelector ContentSelector { get; private set; }

    private CriterionAttachmentsSelector(CriterionName criterion, ContentSelector contentSelector)
    {
        Criterion = criterion;
        ContentSelector = contentSelector;
    }

    public static CriterionAttachmentsSelector New(CriterionName criterion, ContentSelector contentSelector)
        => new (criterion, contentSelector);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Criterion;
        yield return ContentSelector;   
    }
}

public sealed class CriterionName : StringValueObject
{
    public static CriterionName Empty => new();
    private CriterionName() { }
    [JsonConstructor]
    public CriterionName(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static CriterionName New(string value) => new(value);
}

[JsonConverter(typeof(ContenSelectorConverter))]
public sealed class ContentSelector : ValueObject
{
    public string Strategy { get; private set; }
    public string Pattern { get; private set; } = string.Empty;

    private ContentSelector(string strategy, string pattern)
    {
        Strategy = strategy;
        Pattern = pattern;
    }

    public static ContentSelector New(string strategy, string pattern) => new(strategy, pattern);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Strategy;
        yield return Pattern;
    }
}

public class CriterionAttachmentsSelectorConverter : JsonConverter<CriterionAttachmentsSelector>
{
    public override CriterionAttachmentsSelector? ReadJson(JsonReader reader, Type objectType, CriterionAttachmentsSelector? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var criterion = jObject.GetRequired<CriterionName>("Criterion");
        var contentSelector = jObject.GetRequired<ContentSelector>("ContentSelector");
        return CriterionAttachmentsSelector.New(criterion, contentSelector);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, CriterionAttachmentsSelector? value, JsonSerializer serializer) => throw new NotSupportedException();
}

public class ContenSelectorConverter : JsonConverter<ContentSelector>
{
    public override ContentSelector? ReadJson(JsonReader reader, Type objectType, ContentSelector? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var strategy = jObject.GetRequired<string>("Strategy");
        var pattern = jObject.GetRequired<string>("Pattern");
        return ContentSelector.New(strategy, pattern);
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, ContentSelector? value, JsonSerializer serializer) => throw new NotSupportedException();
}