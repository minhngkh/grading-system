using MassTransit;

namespace AssignmentFlow.IntegrationEvents;


public interface IGradingEvent
{
    public string AssessmentId { get; set; }
    public string CriterionName { get; set; }
}

[EntityName("grading.criterion.graded")]
public interface ICriterionGraded : IGradingEvent
{
    public ScoreBreakdownV2 ScoreBreakdown { get; set; }

    /// <summary>
    /// The keys in this metadata dictionary are shared by both grading-service and UI.
    /// </summary>
    public Dictionary<string, object?> Metadata { get; set; }
}

[EntityName("grading.criterion.failed")]
public interface ICriterionGradingFailed : IGradingEvent
{
    public string Error { get; set; }
}

public class ScoreBreakdownV2
{
    public required string Tag { get; set; }
    public required decimal RawScore { get; set; }
    public string Summary { get; set; } = string.Empty; // TODO: add
    public List<FeedbackItemV2> FeedbackItems { get; set; } = [];
}

public class FeedbackItemV2
{
    public required string Comment { get; set; }
    public required string FileRef { get; set; }
    public required string Tag { get; set; }

    /// <summary>
    /// The keys in this metadata dictionary are shared by both grading-service and UI.
    /// </summary>
    public Dictionary<string, object?> LocationData { get; set; } = [];
}
