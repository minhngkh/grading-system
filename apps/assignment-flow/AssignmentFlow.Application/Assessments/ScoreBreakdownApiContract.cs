using JsonApiDotNetCore.Resources.Annotations;

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
}
