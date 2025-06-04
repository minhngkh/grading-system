namespace RubricEngine.Application.Rubrics.Create;

public class CreateRubricResponse
{
    public required string Id { get; init; }
    public required string TeacherId { get; init; }
    public string RubricName { get; init; } = string.Empty;

    public List<string> Tags { get; init; } = [];

    public List<CriterionApiContract> Criteria { get; init; } = [];

    public required DateTimeOffset UpdatedOn { get; init; }

    public required string Status { get; init; }
}
