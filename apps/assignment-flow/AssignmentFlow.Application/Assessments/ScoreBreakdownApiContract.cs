using JsonApiDotNetCore.Resources.Annotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents the score and feedback for a single criterion in a graded submission.
/// </summary>
[NoResource]
public class ScoreBreakdownApiContract
{
    /// <summary>
    /// Gets or sets the name of the criterion.
    /// </summary>
    public required string CriterionName { get; set; }

    /// <summary>
    /// Gets or sets the performance tag associated with this criterion.
    /// </summary>
    public required string PerformanceTag { get; set; }
    
    /// <summary>
    /// Gets or sets the raw unprocessed score for this criterion,
    /// as originally assigned during assessment.
    /// </summary>
    public decimal RawScore { get; set; }

    public string Grader { get; set; } = string.Empty;
    public string Status { get; set; } = "Graded";

    //[JsonIgnore]: TODO: Keep this commented until we can make sure this works
    public string MetadataJson { get; set; } = string.Empty;

    [NotMapped]
    public Dictionary<string, object?> Metadata
    {
        get => string.IsNullOrEmpty(MetadataJson) ? [] : (JsonSerializer.Deserialize<Dictionary<string, object?>>(MetadataJson) ?? []);
        set => MetadataJson = JsonSerializer.Serialize(value);
    }
}
