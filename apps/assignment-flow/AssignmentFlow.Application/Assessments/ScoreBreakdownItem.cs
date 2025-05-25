using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a single score breakdown item, including its criterion, score, performance tag, and feedback.
/// </summary>
[JsonConverter(typeof(ScoreBreakdownItemConverter))]
public sealed class ScoreBreakdownItem : ValueObject
{
    /// <summary>
    /// Gets the criterion identity associated with this score breakdown item.
    /// </summary>
    public CriterionName CriterionName { get; private set; }

    /// <summary>
    /// Gets or sets the raw percentage score awarded for this breakdown item.
    /// This represents the assessed percentage for the criterion before aggregation into the final score.
    /// </summary>
    public required Percentage RawScore { get; init; }

    /// <summary>
    /// Gets or sets the performance tag for this breakdown item.
    /// </summary>
    public required PerformanceTag PerformanceTag { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdownItem"/> class with the specified criterion.
    /// </summary>
    /// <param name="CriterionName">The criterion name.</param>
    public ScoreBreakdownItem(CriterionName criterionName)
    {
        CriterionName = criterionName;
    }

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return CriterionName;
        yield return RawScore;
        yield return PerformanceTag;
    }
    
    // Adds RawScores if other item matches the CriterionName and PerformanceTag
    public static ScoreBreakdownItem operator +(ScoreBreakdownItem a, ScoreBreakdownItem b)
    {
        if (a.CriterionName != b.CriterionName)
            throw new InvalidOperationException("Cannot add ScoreBreakdownItems with different CriterionNames.");

        return new ScoreBreakdownItem(a.CriterionName)
        {
            RawScore = a.RawScore + b.RawScore,
            PerformanceTag = a.PerformanceTag
        };
    }

    // Subtracts RawScores if other item matches the CriterionName and PerformanceTag
    public static ScoreBreakdownItem operator -(ScoreBreakdownItem a, ScoreBreakdownItem b)
    {
        if (a.CriterionName != b.CriterionName)
            throw new InvalidOperationException("Cannot subtract ScoreBreakdownItems with different CriterionNames.");

        return new ScoreBreakdownItem(a.CriterionName)
        {
            RawScore = a.RawScore - b.RawScore,
            PerformanceTag = a.PerformanceTag
        };
    }
}

public sealed class ScoreBreakdownItemConverter : JsonConverter<ScoreBreakdownItem>
{
    public override ScoreBreakdownItem? ReadJson(JsonReader reader, Type objectType, ScoreBreakdownItem? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var criterionIdentity = jObject.GetRequired<CriterionName>("CriterionName");
        var score = jObject.GetRequired<Percentage>("RawScore");
        var performanceTag = jObject.GetRequired<PerformanceTag>("PerformanceTag");

        return new ScoreBreakdownItem(criterionIdentity)
        {
            RawScore = score,
            PerformanceTag = performanceTag,
        };
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, ScoreBreakdownItem? value, JsonSerializer serializer) => throw new NotSupportedException();
}