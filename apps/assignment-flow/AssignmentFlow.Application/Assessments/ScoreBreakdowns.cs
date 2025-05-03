using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a collection of score breakdown items and provides the total score.
/// </summary>
[JsonConverter(typeof(ScoreBreakdownsConverter))]
public sealed class ScoreBreakdowns : ValueObject
{
    /// <summary>
    /// Represents an empty collection of score breakdowns.
    /// </summary>
    public static ScoreBreakdowns Empty = new([]);

    /// <summary>
    /// Gets the array of score breakdown items.
    /// </summary>
    public ScoreBreakdownItem[] BreakdownItems { get; private set; }

    /// <summary>
    /// Gets the total percentage score calculated from the breakdown items.
    /// </summary>
    public Percentage TotalRawScore => Percentage.New(BreakdownItems.Sum(x => x.RawScore));

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdowns"/> class with the specified breakdown items.
    /// </summary>
    /// <param name="scoreBreakdownItems">The array of score breakdown items.</param>
    private ScoreBreakdowns(ScoreBreakdownItem[] scoreBreakdownItems) =>
        BreakdownItems = scoreBreakdownItems;

    /// <summary>
    /// Creates a new instance of <see cref="ScoreBreakdowns"/> with the specified breakdown items.
    /// </summary>
    /// <param name="scoreBreakdownItems">The array of score breakdown items.</param>
    /// <returns>A new <see cref="ScoreBreakdowns"/> instance.</returns>
    public static ScoreBreakdowns New(ScoreBreakdownItem[] scoreBreakdownItems) =>
        new(scoreBreakdownItems);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable list of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        foreach (var item in BreakdownItems)
        {
            yield return item;
        }
    }
}

public sealed class ScoreBreakdownsConverter : JsonConverter<ScoreBreakdowns>
{

    public override ScoreBreakdowns? ReadJson(JsonReader reader, Type objectType, ScoreBreakdowns? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var breakdownItems = jObject.GetRequired<ScoreBreakdownItem[]>("BreakdownItems");
        return ScoreBreakdowns.New(breakdownItems);
    }
    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, ScoreBreakdowns? value, JsonSerializer serializer) => throw new NotSupportedException();
}