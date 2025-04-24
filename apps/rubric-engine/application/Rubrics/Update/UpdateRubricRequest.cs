using System.ComponentModel.DataAnnotations;
using RubricEngine.Application.Shared;

namespace RubricEngine.Application.Rubrics.Update;

public class UpdateRubricRequest
{
    [MaxLength(ModelConstants.MediumText)]
    public string? Name { get; init; }

    public List<string>? PerformanceTags { get; init; }

    public List<CriterionApiContract>? Criteria { get; init; }
}