using AssignmentFlow.Application.Shared;
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
    /// Gets or sets the score for this breakdown item.
    /// </summary>
    public required Score Score { get; init; }

    /// <summary>
    /// Gets or sets the performance tag for this breakdown item.
    /// </summary>
    public required PerformanceTag PerformanceTag { get; init; }

    /// <summary>
    /// Gets the feedbacks related to this score breakdown item.
    /// </summary>
    public Feedback[] Feedbacks { get; init; } = [];

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
        yield return Score;
        yield return PerformanceTag;
        foreach (var feedback in Feedbacks)
        {
            yield return feedback;
        }
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
        var score = jObject.GetRequired<Score>("Score");
        var performanceTag = jObject.GetRequired<PerformanceTag>("PerformanceTag");
        var feedbacks = jObject.Get<Feedback[]>("Feedbacks");

        return new ScoreBreakdownItem(criterionIdentity)
        {
            Score = score,
            PerformanceTag = performanceTag,
            Feedbacks = feedbacks ?? []
        };
    }
    public override bool CanWrite => false;
    public override void WriteJson(JsonWriter writer, ScoreBreakdownItem? value, JsonSerializer serializer) => throw new NotSupportedException();
}