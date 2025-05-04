using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
        
namespace RubricEngine.Application.Rubrics;

[JsonConverter(typeof(CriterionConverter))]
public sealed class Criterion : ValueObject
{
    private Criterion(CriterionName name, Percentage weight, List<PerformanceLevel> levels)
    {
        Name = name;
        Weight = weight;
        Levels = levels;
    }

    public CriterionName Name { get; }

    public Percentage Weight { get; }

    public List<PerformanceLevel> Levels { get; } = [];

    public static Criterion New(CriterionName name, Percentage weight, List<PerformanceLevel> levels)
        => new(name, weight, levels);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Name;

        foreach (var level in Levels)
        {
            yield return level;
        }
    }
}

public sealed class CriterionConverter : JsonConverter<Criterion>
{
    public override Criterion? ReadJson(JsonReader reader, Type objectType, Criterion? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;

        var jObject = JObject.Load(reader);

        var name = jObject.GetRequired<CriterionName>("Name");
        var weight = jObject.GetRequired<Percentage>("Weight");
        var levels = jObject.GetRequired<List<PerformanceLevel>>("Levels");

        return Criterion.New(name, weight, levels);
    }

    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, Criterion? value, JsonSerializer serializer) => throw new NotSupportedException();
}

public static class CriterionExtensions
{
    public static List<CriterionApiContract> ToApiContract(this IEnumerable<Criterion> criteria)
    {
        return [.. criteria.Select(ToApiContract)];
    }

    public static CriterionApiContract ToApiContract(this Criterion criterion)
    {
        return new CriterionApiContract
        {
            Name = criterion.Name.Value,
            Weight = criterion.Weight.Value,
            Levels = criterion.Levels.ToApiContract()
        };
    }
}