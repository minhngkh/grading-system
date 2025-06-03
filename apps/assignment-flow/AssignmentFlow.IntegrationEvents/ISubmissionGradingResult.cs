using MassTransit;

namespace AssignmentFlow.IntegrationEvents;

[EntityName("grading.submission.graded")]
public interface ISubmissionGradingResult
{
    public string AssessmentId { get; set; }
    public List<ScoreBreakdown> ScoreBreakdowns { get; set; }
    public List<string> Errors { get; set; }
}
