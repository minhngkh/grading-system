using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RubricEngine.Application.Shared;

namespace RubricEngine.Application.Rubrics;

[JsonConverter(typeof(PerformanceLevelConverter))]
public sealed class PerformanceLevel : ValueObject
{
    private PerformanceLevel(PerformanceTag tag, string description, Percentage weight)
    {
        Tag = tag;
        Description = description;
        Weight = weight;
    }

    public PerformanceTag Tag { get; init; }

    public string Description { get; init; }

    public Percentage Weight { get; init; }

    public static PerformanceLevel New(PerformanceTag tag, string description, Percentage weight)
        => new(tag, description, weight);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Tag;
        yield return Weight;
        yield return Description;
    }
}

public sealed class PerformanceLevelConverter : JsonConverter<PerformanceLevel>
{
    public override PerformanceLevel? ReadJson(JsonReader reader, Type objectType, PerformanceLevel? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;

        var jObject = JObject.Load(reader);

        var tag = jObject.GetRequired<PerformanceTag>("Tag");
        var description = jObject.GetRequired<string>("Description");
        var weight = jObject.GetRequired<Percentage>("Weight");

        return PerformanceLevel.New(tag, description, weight);
    }

    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, PerformanceLevel? value, JsonSerializer serializer) => throw new NotSupportedException();
}

public static class PerformanceLevelExtensions
{
    public static List<PerformanceLevelApiContract> ToApiContract(this IEnumerable<PerformanceLevel> performanceLevels)
    {
        return [.. performanceLevels.Select(ToApiContract)];
    }

    public static PerformanceLevelApiContract ToApiContract(this PerformanceLevel performanceLevel)
    {
        return new PerformanceLevelApiContract
        {
            PerformanceTag = performanceLevel.Tag.Value,
            Description = performanceLevel.Description,
            Weight = performanceLevel.Weight.Value
        };
    }
}