using JsonApiDotNetCore.Resources.Annotations;

namespace RubricEngine.Application.Rubrics;

[NoResource]
public class CriterionApiContract
{
    public string Name { get; set; } = string.Empty;
    public decimal Weight { get; set; }
    public string Plugin { get; set; } = string.Empty;
    public string Configuration { get; set; } = string.Empty;

    public List<PerformanceLevelApiContract> Levels { get; set; } = [];
}

[NoResource]
public class PerformanceLevelApiContract
{
    public required string Tag { get; init; }
    public required string Description { get; init; }
    public required decimal Weight { get; init; }
}


