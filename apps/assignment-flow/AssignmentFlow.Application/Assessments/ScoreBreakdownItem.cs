using EventFlow.ValueObjects;
using Google.Protobuf;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Numerics;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a single score breakdown item, including its criterion, score, performance tag, and feedback.
/// </summary>
[JsonConverter(typeof(ScoreBreakdownItemConverter))]
public sealed class ScoreBreakdownItem : ValueObject, IDeepCloneable<ScoreBreakdownItem>
{
    public static ScoreBreakdownItem Pending(string criterion) => new(CriterionName.New(criterion)) { Status = "Pending" };
    public static ScoreBreakdownItem Mannual(string criterion) => new(CriterionName.New(criterion)) { Status = "Mannual" };

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

    public string Status { get; set; } = "Pending"; // Default status, can be updated based on grading logic
    public string FailureReason { get; set; } = string.Empty; // Optional reason for failure, if applicable

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdownItem"/> class with the specified criterion.
    /// </summary>
    /// <param name="CriterionName">The criterion name.</param>
    public ScoreBreakdownItem(CriterionName criterionName)
    {
        CriterionName = criterionName;
    }

    public bool IsCompleted => Status == "Graded" || Status == "Failed" || Status == "Mannual";

    public void MarkAsGraded()
    {
        Status = "Graded";
    }

    public void MarkAsFailed(string reason)
    {
        Status = "Failed";
        FailureReason = reason;
    }

    public ScoreBreakdownItem Clone()
    {
        return new ScoreBreakdownItem(CriterionName)
        {
            RawScore = RawScore,
            PerformanceTag = PerformanceTag,
            MetadataJson = MetadataJson,
            Grader = Grader,
            Status = Status,
            FailureReason = FailureReason
        };
    }

    public ScoreBreakdownItem NormalizedScore(IEnumerable<Criterion> criteria)
    {
        var item = Clone();
        var criterion = criteria.FirstOrDefault(c => c.Name == CriterionName);
        item.RawScore *= (criterion?.Weight ?? 0) / 100m; // Normalize score based on criterion weight
        return item;
    }

    // Adds RawScores if other item matches the CriterionName and PerformanceTag
    public static ScoreBreakdownItem operator +(ScoreBreakdownItem a, ScoreBreakdownItem b)
    {
        if (a.CriterionName != b.CriterionName)
            throw new InvalidOperationException("Cannot add ScoreBreakdownItems with different CriterionNames.");

        return new ScoreBreakdownItem(a.CriterionName)
        {
            RawScore = a.RawScore + b.RawScore,
            Grader = a.Grader,
            PerformanceTag = a.PerformanceTag,
            MetadataJson = a.MetadataJson,
            Status = a.Status,
            FailureReason = a.FailureReason // This should be cleared since we're manually adding scores
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
            MetadataJson = a.MetadataJson,
            Status = a.Status,
            FailureReason = a.FailureReason // This should be cleared since we're manually subtracting scores
        };
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
        yield return MetadataJson;
        yield return Grader;
        yield return Status;
        yield return FailureReason;
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
        var grader = jObject.GetRequired<Grader>("Grader");
        var status = jObject.GetRequired<string>("Status");
        var metadataJson = jObject.Get<string>("MetadataJson") ?? string.Empty;
        var failureReason = jObject.Get<string>("FailureReason") ?? string.Empty;

        return new ScoreBreakdownItem(criterionIdentity)
        {
            RawScore = score,
            Status = status,
            Grader = grader,
            PerformanceTag = performanceTag,
            MetadataJson = metadataJson,
            FailureReason = failureReason
        };
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, ScoreBreakdownItem? value, JsonSerializer serializer) => throw new NotSupportedException();
}
