namespace AssignmentFlow.IntegrationEvents;

public interface ISubmissionGradingStarted : IGradingEvent
{
    public string SubmissionReference { get; set; }
    public Criterion[] Criteria { get; set; }
}

public class Criterion
{
    public required string CriterionName { get; set; }
    public required string[]  FileRefs { get; set; }
    public required Level[] Levels { get; set; }
}

public class Level
{
    public required string Tag { get; set; }
    public required string Description { get; set; }
    public required decimal Weight { get; set; }
}