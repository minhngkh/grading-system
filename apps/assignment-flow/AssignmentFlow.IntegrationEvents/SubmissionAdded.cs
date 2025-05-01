namespace AssignmentFlow.IntegrationEvents;

public class SubmissionAdded
{
    public string TeacherId { get; set; } = string.Empty;
    public string GradingId { get; set; } = string.Empty;
    public string SubmissionId { get; set; } = string.Empty;
}
