using System.ComponentModel.DataAnnotations;
using JsonApiDotNetCore.Resources.Annotations;

namespace RubricEngine.Application.Rubrics;

[NoResource]
public class CriterionApiContract
{
    [MaxLength(ModelConstants.ShortText)]
    public required string Name { get; set; }
    
    public required decimal Weight { get; set; }

    [MaxLength(ModelConstants.ShortText)]
    public string Plugin { get; set; } = string.Empty;
    
    [MaxLength(ModelConstants.ShortText)]
    public string Configuration { get; set; } = string.Empty;

    public List<PerformanceLevelApiContract> Levels { get; set; } = [];
}

[NoResource]
public class PerformanceLevelApiContract
{
    [MaxLength(ModelConstants.ShortText)]
    public required string Tag { get; init; }

    [MaxLength(ModelConstants.MediumText)]
    public required string Description { get; init; }
    
    public required decimal Weight { get; init; }
}


