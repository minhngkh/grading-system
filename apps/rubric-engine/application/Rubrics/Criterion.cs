using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
        
namespace RubricEngine.Application.Rubrics;

[JsonConverter(typeof(CriterionConverter))]
public sealed class Criterion : ValueObject
{
    private Criterion(CriterionName name, Percentage weight, List<PerformanceLevel> levels, Plugin plugin, Configuration configuration)
    {
        Name = name;
        Weight = weight;
        Levels = levels;
        Plugin = plugin;
        Configuration = configuration;
    }

    public CriterionName Name { get; }

    public Percentage Weight { get; }

    public List<PerformanceLevel> Levels { get; } = [];

    public Plugin Plugin { get; } = Plugin.None;

    public Configuration Configuration { get; } = Configuration.None;

    public static Criterion New(CriterionName name, Percentage weight, List<PerformanceLevel> levels, Plugin plugin, Configuration configuration)
        => new(name, weight, levels, plugin, configuration);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Name;
        yield return Weight;
        yield return Plugin;
        yield return Configuration;
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
        var plugin = jObject.GetRequired<Plugin>("Plugin");
        var configuration = jObject.GetRequired<Configuration>("Configuration");

        return Criterion.New(name, weight, levels, plugin, configuration);
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
            Levels = criterion.Levels.ToApiContract(),
            Plugin = criterion.Plugin.Value,
            Configuration = criterion.Configuration.Value
        };
    }
}