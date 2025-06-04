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
    public static ScoreBreakdowns Empty => new([]);

    /// <summary>
    /// Gets the array of score breakdown items.
    /// </summary>
    public List<ScoreBreakdownItem> BreakdownItems { get; private set; }

    /// <summary>
    /// Gets the total percentage score calculated from the breakdown items.
    /// </summary>
    public Percentage TotalRawScore => Percentage.New(BreakdownItems.Sum(x => x.RawScore));

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdowns"/> class with the specified breakdown items.
    /// </summary>
    /// <param name="scoreValue">The array of score breakdown items.</param>
    private ScoreBreakdowns(List<ScoreBreakdownItem> scoreValue) =>
        BreakdownItems = scoreValue;

    /// <summary>
    /// Creates a new instance of <see cref="ScoreBreakdowns"/> with the specified breakdown items.
    /// </summary>
    /// <param name="scoreBreakdownItems">The array of score breakdown items.</param>
    /// <returns>A new <see cref="ScoreBreakdowns"/> instance.</returns>
    public static ScoreBreakdowns New(List<ScoreBreakdownItem> scoreBreakdownItems) =>
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
    
    // Plus operator: Combines two lists (summing scores with the same criteria/tags)
    public static ScoreBreakdowns operator +(ScoreBreakdowns a, ScoreBreakdowns b)
    {
        var dictionary = a.BreakdownItems.ToDictionary(
            item => item.CriterionName,
            item => item);

        foreach (var item in b.BreakdownItems)
        {
            var key = item.CriterionName;
            if (!dictionary.TryAdd(key, item))
                dictionary[key] += item;
        }

        return new ScoreBreakdowns(dictionary.Values.ToList());
    }

    // Minus operator: Subtracts matching ScoreBreakdownItems by CriterionName/PerformanceTag
    public static ScoreBreakdowns operator -(ScoreBreakdowns a, ScoreBreakdowns b)
    {
        var dictionary = a.BreakdownItems.ToDictionary(
            item => item.CriterionName,
            item => item);

        foreach (var item in b.BreakdownItems)
        {
            var key = item.CriterionName;
            if (!dictionary.TryAdd(key, item))
                dictionary[key] -= item;
        }

        return new ScoreBreakdowns(dictionary.Values.ToList());
    }
}

public sealed class ScoreBreakdownsConverter : JsonConverter<ScoreBreakdowns>
{
    public override ScoreBreakdowns? ReadJson(JsonReader reader, Type objectType, ScoreBreakdowns? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var breakdownItems = jObject.GetRequired<List<ScoreBreakdownItem>>("BreakdownItems");
        return ScoreBreakdowns.New(breakdownItems);
    }
    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, ScoreBreakdowns? value, JsonSerializer serializer) => throw new NotSupportedException();
}

public static class ScoreBreakdownsExtension
{
    public static List<ScoreBreakdownApiContract> ToApiContracts(this ScoreBreakdowns scoreBreakdowns)
    {
        return scoreBreakdowns.BreakdownItems.ConvertAll(sb => new ScoreBreakdownApiContract
        {
            CriterionName = sb.CriterionName,
            PerformanceTag = sb.PerformanceTag,
            RawScore = sb.RawScore
        });
    }

    public static List<FeedbackItemApiContract> ToApiContracts(this List<Feedback> feedbacks)
    {
        return feedbacks.ConvertAll(fb => new FeedbackItemApiContract
        {
            Criterion = fb.Criterion,
            Comment = fb.Comment,
            FileRef = fb.Highlight.Attachment,
            FromCol = fb.Highlight.Location.FromColumn,
            FromLine = fb.Highlight.Location.FromLine,
            ToCol = fb.Highlight.Location.ToColumn,
            ToLine = fb.Highlight.Location.ToLine,
            Tag = fb.Tag,
        });
    }
}