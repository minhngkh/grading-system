using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a collection of score breakdown items and provides the total score.
/// </summary>
[JsonConverter(typeof(ScoreBreakdownsConverter))]
public sealed class ScoreBreakdowns : ValueObject, IEnumerable<ScoreBreakdownItem>
{
    /// <summary>
    /// Represents an empty collection of score breakdowns.
    /// </summary>
    public static ScoreBreakdowns Empty => new([]);

    /// <summary>
    /// Gets the array of score breakdown items.
    /// </summary>
    private Dictionary<CriterionName, ScoreBreakdownItem> BreakdownItems { get; }

    /// <summary>
    /// Gets the total percentage score calculated from the breakdown items.
    /// </summary>
    public Percentage TotalRawScore => Percentage.New(BreakdownItems.Values.Sum(x => x.RawScore));

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdowns"/> class with the specified breakdown items.
    /// </summary>
    /// <param name="scoreValue">The array of score breakdown items.</param>
    private ScoreBreakdowns(Dictionary<CriterionName, ScoreBreakdownItem> scoreValue) =>
        BreakdownItems = scoreValue;

    /// <summary>
    /// Creates a new instance of <see cref="ScoreBreakdowns"/> with the specified breakdown items.
    /// </summary>
    /// <param name="scoreBreakdownItems">The dictionary of score breakdown items.</param>
    /// <returns>A new <see cref="ScoreBreakdowns"/> instance.</returns>
    public static ScoreBreakdowns New(Dictionary<CriterionName, ScoreBreakdownItem> scoreBreakdownItems) =>
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
        foreach (var (k, v) in b.BreakdownItems)
        {
            if (!a.BreakdownItems.TryAdd(k, v))
                a.BreakdownItems[k] += v;
        }

        return a;
    }

    // Minus operator: Subtracts matching ScoreBreakdownItems by CriterionName/PerformanceTag
    public static ScoreBreakdowns operator -(ScoreBreakdowns a, ScoreBreakdowns b)
    {
        foreach (var (k, v) in b.BreakdownItems)
        {
            if (!a.BreakdownItems.TryAdd(k, v))
                a.BreakdownItems[k] -= v;
        }

        return a;
    }


    public void AddOrUpdate(ScoreBreakdownItem item)
    {
        BreakdownItems.TryAdd(item.CriterionName, item);
    }

    public IEnumerator<ScoreBreakdownItem> GetEnumerator()
    {
        return BreakdownItems.Values.GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
}

public sealed class ScoreBreakdownsConverter : JsonConverter<ScoreBreakdowns>
{
    public override ScoreBreakdowns? ReadJson(JsonReader reader, Type objectType, ScoreBreakdowns? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var breakdownItems = jObject.GetRequired<Dictionary<CriterionName, ScoreBreakdownItem>>("BreakdownItems");
        return ScoreBreakdowns.New(breakdownItems);
    }
    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, ScoreBreakdowns? value, JsonSerializer serializer) => throw new NotSupportedException();
}

public static class ScoreBreakdownsExtension
{
    public static List<ScoreBreakdownApiContract> ToApiContracts(this ScoreBreakdowns scoreBreakdowns)
    {
        return [.. scoreBreakdowns.Select(sb => sb.ToApiContract())];
    }

    public static ScoreBreakdownApiContract ToApiContract(this ScoreBreakdownItem scoreBreakdownItem)
    {
        return new ScoreBreakdownApiContract
        {
            CriterionName = scoreBreakdownItem.CriterionName,
            PerformanceTag = scoreBreakdownItem.PerformanceTag,
            RawScore = scoreBreakdownItem.RawScore,
            MetadataJson = scoreBreakdownItem.MetadataJson
        };
    }

    public static List<FeedbackItemApiContract> ToApiContracts(this List<Feedback> feedbacks)
    {
        return feedbacks.ConvertAll(fb => new FeedbackItemApiContract
        {
            Criterion = fb.Criterion,
            Comment = fb.Comment,
            FileRef = fb.Highlight.Attachment,
            LocationDataJson = fb.Highlight.LocationDataJson,
            Tag = fb.Tag,
        });
    }
}
