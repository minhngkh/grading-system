namespace AssignmentFlow.IntegrationEvents;

public class ScoreBreakdown
{
    public required string CriterionName { get; set; }
    public required string Tag { get; set; }
    public required decimal RawScore { get; set; }
    public string Summary { get; set; } = string.Empty; // TODO: add
    public List<FeedbackItem> FeedbackItems { get; set; } = [];
}
