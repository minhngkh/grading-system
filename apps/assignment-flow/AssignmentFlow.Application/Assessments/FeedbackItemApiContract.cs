using JsonApiDotNetCore.Resources.Annotations;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a specific feedback item that may include file references and text positioning.
/// </summary>
[NoResource]
public class FeedbackItemApiContract
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