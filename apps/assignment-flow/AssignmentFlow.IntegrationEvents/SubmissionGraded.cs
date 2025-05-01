namespace AssignmentFlow.IntegrationEvents;

/// <summary>
/// Represents an event that is published when a submission has been graded.
/// </summary>
public class SubmissionGraded
{
    /// <summary>
    /// Gets or sets the unique identifier for the submission.
    /// </summary>
    public required string AssessmentId { get; set; }

    /// <summary>
    /// Gets or sets the collection of score breakdowns for each criterion.
    /// </summary>
    public required List<ScoreBreakdownDto> ScoreBreakdownDtos { get; set; }
}

/// <summary>
/// Represents the score and feedback for a single criterion in a graded submission.
/// </summary>
public class ScoreBreakdownDto
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
    /// Gets or sets the raw score (as a percentage) awarded for this criterion. 
    /// For example, 75.5 represents 75.5% achieved for the criterion.
    /// This value is used for further aggregation into the final submission score.
    /// </summary>
    public required decimal RawScore { get; set; } // e.g. 75.5m for 75.5%

    /// <summary>
    /// Gets or sets the collection of detailed feedback items for this criterion.
    /// </summary>
    public List<FeedbackItemDto> FeedbackItems { get; set; } = [];
}

/// <summary>
/// Represents a specific feedback item that may include file references and text positioning.
/// </summary>
public class FeedbackItemDto
{
    public required string Criterion { get; set; }

    /// <summary>
    /// Gets or sets the file reference identifier.
    /// </summary>
    public required string FileRef { get; set; }

    /// <summary>
    /// Gets or sets the starting line number for this feedback.
    /// </summary>
    public required int FromLine { get; set; }

    /// <summary>
    /// Gets or sets the ending line number for this feedback.
    /// </summary>
    public required int ToLine { get; set; }

    /// <summary>
    /// Gets or sets the starting column number for this feedback.
    /// </summary>
    public required int FromCol { get; set; }

    /// <summary>
    /// Gets or sets the ending column number for this feedback.
    /// </summary>
    public required int ToCol { get; set; }

    /// <summary>
    /// Gets or sets the feedback comment text.
    /// </summary>
    public required string Comment { get; set; }

    public required string Tag { get; set; }
}
