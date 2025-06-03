using MassTransit;

namespace AssignmentFlow.IntegrationEvents;

[EntityName("grading.submission.started")]
public interface ISubmissionGradingStarted
{
    public string AssessmentId { get; set; }
    public Criterion[] Criteria { get; set; }
}

public class Criterion
{
    public required string CriterionName { get; set; }
    public required string[] FileRefs { get; set; }
    public required Level[] Levels { get; set; }
    public required string Plugin { get; set; }
    public required string Configuration { get; set; }
}

public class Level
{
    public required string Tag { get; set; }
    public required string Description { get; set; }
    public required decimal Weight { get; set; } // FIXME: this is a string in payload
}