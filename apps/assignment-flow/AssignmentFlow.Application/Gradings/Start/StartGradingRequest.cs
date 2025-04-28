namespace AssignmentFlow.Application.Gradings.Start;

public class StartGradingRequest
{
    public string RubricId { get; init; } = string.Empty;
    public List<CriteriaFilesMappingApiContract> CriteriaFilesMappings { get; set; } = [];
}
