namespace AssignmentFlow.Application.Grading.Start;

public class StartGradingRequest
{
    public string RubricId { get; init; } = string.Empty;
    public List<CriteriaFilesMapping> CriteriaFilesMappings { get; set; } = [];
}
