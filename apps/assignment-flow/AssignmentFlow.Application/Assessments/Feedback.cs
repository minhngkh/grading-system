using EventFlow.ValueObjects;
using Newtonsoft.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents feedback associated with a score breakdown item.
/// </summary>
public sealed class Feedback : ValueObject
{
    /// <summary>
    /// Gets the comment associated with the feedback.
    /// </summary>
    public string Comment { get; private set; }

    /// <summary>
    /// Gets the attachments related to the feedback, used for highlighting or annotating content in documents.
    /// </summary>
    public FeedbackAttachment Attachment { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Feedback"/> class with the specified comment.
    /// </summary>
    /// <param name="comment">The feedback comment.</param>
    /// <param name="attachment">The feedback attachment.</param>
    public Feedback(string comment, FeedbackAttachment attachment)
    {
        Comment = comment;
        Attachment = attachment;
    }

    /// <summary>
    /// Creates a new instance of <see cref="Feedback"/> with the specified comment and attachment.
    /// </summary>
    /// <param name="comment">The feedback comment.</param>
    /// <param name="attachment">The feedback attachment.</param>
    /// <returns>A new <see cref="Feedback"/> instance.</returns>
    public static Feedback New(string comment, FeedbackAttachment attachment) => new(comment, attachment);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Comment;
        yield return Attachment;
    }
}
