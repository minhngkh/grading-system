namespace AssignmentFlow.IntegrationEvents;

public interface ISubmissionGradingResult : IGradingEvent
{
    public string SubmissionReference { get; set; }
    public List<ScoreBreakdown> ScoreBreakdowns { get; set; }
}

