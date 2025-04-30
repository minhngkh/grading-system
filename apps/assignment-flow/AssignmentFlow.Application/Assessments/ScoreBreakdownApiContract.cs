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
    /// Gets or sets the score awarded for this criterion.
    /// </summary>
    public required int Score { get; set; }

    /// <summary>
    /// Gets or sets the general comment for this criterion.
    /// </summary>
    public required string Comment { get; set; }

    /// <summary>
    /// Gets or sets the collection of detailed feedback items for this criterion.
    /// </summary>
    public List<FeedbackItemApiContract> FeedbackItems { get; set; } = new();
}
