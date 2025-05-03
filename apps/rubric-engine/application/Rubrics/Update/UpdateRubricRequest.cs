using System.ComponentModel.DataAnnotations;

namespace RubricEngine.Application.Rubrics.Update;

public class UpdateRubricRequest
{
    [MaxLength(ModelConstants.MediumText)]
    public string? Name { get; init; }

    public List<string>? Tags { get; init; }

    public List<CriterionApiContract>? Criteria { get; init; }
}