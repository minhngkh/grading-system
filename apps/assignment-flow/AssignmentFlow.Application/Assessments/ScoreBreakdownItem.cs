using EventFlow.ValueObjects;
using Google.Protobuf;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a single score breakdown item, including its criterion, score, performance tag, and feedback.
/// </summary>
[JsonConverter(typeof(ScoreBreakdownItemConverter))]
public sealed class ScoreBreakdownItem : ValueObject, IDeepCloneable<ScoreBreakdownItem>
{
    public static ScoreBreakdownItem Pending(CriterionName criterion) => new ScoreBreakdownItem(criterion) { Status = "Pending" };

    public Grader Grader { get; init; } = Grader.AIGrader;

    /// <summary>
    /// Gets the criterion identity associated with this score breakdown item.
    /// </summary>
    public CriterionName CriterionName { get; private set; }

    /// <summary>
    /// Gets or sets the raw percentage score awarded for this breakdown item.
    /// This represents the assessed percentage for the criterion before aggregation into the final score.
    /// </summary>
    public Percentage RawScore { get; set; } = Percentage.Zero;

    /// <summary>
    /// Gets or sets the performance tag for this breakdown item.
    /// </summary>
    public PerformanceTag PerformanceTag { get; init; } = PerformanceTag.Default;

    public string MetadataJson { get; init; } = string.Empty;

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdownItem"/> class with the specified criterion.
    /// </summary>
    /// <param name="CriterionName">The criterion name.</param>
    public ScoreBreakdownItem(CriterionName criterionName)
    {
        CriterionName = criterionName;
    }

    public void NormalizeRawScore(decimal factor)
    {
        RawScore *= (factor / 100);
    }

    public void MarkAsCompleted()
    {
        Status = "Completed";
    }

    public string Status { get; set; } = "Pending"; // Default status, can be updated based on grading logic

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return CriterionName;
        yield return RawScore;
        yield return PerformanceTag;
        yield return MetadataJson; // Include metadata in equality check
        yield return Grader;
        yield return Status; // Include status in equality check
    }

    public ScoreBreakdownItem Clone()
    {
        return new ScoreBreakdownItem(CriterionName)
        {
            RawScore = RawScore,
            PerformanceTag = PerformanceTag,
            MetadataJson = MetadataJson,
            Grader = Grader,
            Status = Status // Clone the status as well
        };
    }

    // Adds RawScores if other item matches the CriterionName and PerformanceTag
    public static ScoreBreakdownItem operator +(ScoreBreakdownItem a, ScoreBreakdownItem b)
    {
        if (a.CriterionName != b.CriterionName)
            throw new InvalidOperationException("Cannot add ScoreBreakdownItems with different CriterionNames.");

        return new ScoreBreakdownItem(a.CriterionName)
        {
            RawScore = a.RawScore + b.RawScore,
            Grader = a.Grader, // Keep the Grader from the first item
            PerformanceTag = a.PerformanceTag,
            MetadataJson = a.MetadataJson, // Keep metadata from the first item
            Status = a.Status // Keep status from the first item
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
            Grader = a.Grader,
            PerformanceTag = a.PerformanceTag,
            MetadataJson = a.MetadataJson, // Keep metadata from the first item
            Status = a.Status // Keep status from the first item
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
        var metadataJson = jObject.Get<string>("MetadataJson") ?? string.Empty;
        var grader = jObject.GetValue("Grader", StringComparison.OrdinalIgnoreCase)?.ToObject<Grader>() ?? Grader.AIGrader;
        var status = jObject.Get<string>("Status") ?? "Pending";

        return new ScoreBreakdownItem(criterionIdentity)
        {
            RawScore = score,
            PerformanceTag = performanceTag,
            MetadataJson = metadataJson,
            Grader = grader,
            Status = status
        };
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, ScoreBreakdownItem? value, JsonSerializer serializer) => throw new NotSupportedException();
}
