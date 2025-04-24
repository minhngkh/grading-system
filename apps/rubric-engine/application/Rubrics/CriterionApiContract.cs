namespace RubricEngine.Application.Rubrics;

public class CriterionApiContract
{
    public string Name { get; set; } = string.Empty;
    public decimal Weight { get; set; }

    public List<PerformanceLevelApiContract> Levels { get; set; } = [];
}

public class PerformanceLevelApiContract
{    
    public required string PerformanceTag { get; init; }
    public required string Description { get; init; }
    public required decimal Weight { get; init; }
}


