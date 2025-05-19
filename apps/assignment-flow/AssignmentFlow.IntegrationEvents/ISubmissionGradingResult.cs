namespace AssignmentFlow.IntegrationEvents;

public interface ISubmissionGradingResult
{
    public string AssessmentId { get; set; }
    public List<ScoreBreakdown> ScoreBreakdowns { get; set; }
    public List<string> Errors { get; set; }
}
