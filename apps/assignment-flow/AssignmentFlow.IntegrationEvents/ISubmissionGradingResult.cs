using MassTransit;

namespace AssignmentFlow.IntegrationEvents;

[EntityName("grading.submission.graded")]
public interface ISubmissionGradingResult
{
    public string AssessmentId { get; set; }
    public List<ScoreBreakdown> ScoreBreakdowns { get; set; }
    public List<ErrorDetail> Errors { get; set; }
}

public class ErrorDetail
{
    public required string CriterionName { get; set; }
    public required string Error { get; set; }
}
