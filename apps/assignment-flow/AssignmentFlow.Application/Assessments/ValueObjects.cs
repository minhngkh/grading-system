using EventFlow.ValueObjects;
using Newtonsoft.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a collection of score breakdown items and provides the total score.
/// </summary>
public sealed class ScoreBreakdowns : ValueObject
{
    /// <summary>
    /// Represents an empty collection of score breakdowns.
    /// </summary>
    public static ScoreBreakdowns Empty = new([]);

    /// <summary>
    /// Gets the array of score breakdown items.
    /// </summary>
    public ScoreBreakdownItem[] BreakdownItems { get; private set; }

    /// <summary>
    /// Gets the total score calculated from the breakdown items.
    /// </summary>
    public Score TotalScore => Score.New(BreakdownItems.Sum(x => x.Score));

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdowns"/> class with the specified breakdown items.
    /// </summary>
    /// <param name="scoreBreakdownItems">The array of score breakdown items.</param>
    private ScoreBreakdowns(ScoreBreakdownItem[] scoreBreakdownItems) =>
        BreakdownItems = scoreBreakdownItems;

    /// <summary>
    /// Creates a new instance of <see cref="ScoreBreakdowns"/> with the specified breakdown items.
    /// </summary>
    /// <param name="scoreBreakdownItems">The array of score breakdown items.</param>
    /// <returns>A new <see cref="ScoreBreakdowns"/> instance.</returns>
    public ScoreBreakdowns New(ScoreBreakdownItem[] scoreBreakdownItems) =>
        new(scoreBreakdownItems);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        foreach (var item in BreakdownItems)
        {
            yield return item;
        }
    }
}

/// <summary>
/// Represents a single score breakdown item, including its criterion, score, performance tag, and feedback.
/// </summary>
public sealed class ScoreBreakdownItem : ValueObject
{
    /// <summary>
    /// Gets the criterion identity associated with this score breakdown item.
    /// </summary>
    public CriterionIdentity CriterionIdentity { get; private set; }

    /// <summary>
    /// Gets or sets the score for this breakdown item.
    /// </summary>
    public required Score Score { get; init; }

    /// <summary>
    /// Gets or sets the performance tag for this breakdown item.
    /// </summary>
    public required PerformanceTag PerformanceTag { get; init; }

    /// <summary>
    /// Gets the feedbacks related to this score breakdown item.
    /// </summary>
    public Feedback[] Feedbacks { get; private set; } = [];

    /// <summary>
    /// Gets the source of the score (e.g., "Teacher", "Peer", "Self", "AI").
    /// </summary>
    public string Source { get; private set; } = string.Empty;

    /// <summary>
    /// Initializes a new instance of the <see cref="ScoreBreakdownItem"/> class with the specified criterion identity.
    /// </summary>
    /// <param name="criterionIdentity">The criterion identity.</param>
    public ScoreBreakdownItem(CriterionIdentity criterionIdentity)
    {
        CriterionIdentity = criterionIdentity;
    }

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return CriterionIdentity;
        yield return Score;
        yield return PerformanceTag;
        foreach (var feedback in Feedbacks)
        {
            yield return feedback;
        }
    }
}

/// <summary>
/// Represents the identity of a criterion, including its rubric ID and name.
/// </summary>
public sealed class CriterionIdentity : ValueObject
{
    /// <summary>
    /// Gets the rubric ID associated with this criterion.
    /// </summary>
    public string RubricId { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the name of the criterion.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Initializes a new instance of the <see cref="CriterionIdentity"/> class with the specified rubric ID and name.
    /// </summary>
    /// <param name="rubricId">The rubric ID.</param>
    /// <param name="name">The name of the criterion.</param>
    public CriterionIdentity(string rubricId, string name)
    {
        RubricId = rubricId;
        Name = name;
    }

    /// <summary>
    /// Creates a new instance of <see cref="CriterionIdentity"/> with the specified rubric ID and name.
    /// </summary>
    /// <param name="id">The rubric ID.</param>
    /// <param name="name">The name of the criterion.</param>
    /// <returns>A new <see cref="CriterionIdentity"/> instance.</returns>
    public CriterionIdentity New(string id, string name) => new(id, name);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return RubricId;
        yield return Name;
    }
}

/// <summary>
/// Represents an attachment associated with feedback that can be used to highlight content in a document.
/// </summary>
public sealed class FeedbackAttachment : ValueObject
{
    /// <summary>
    /// Gets the reference identifier for the attachment.
    /// </summary>
    public string ReferenceId { get; private set; }

    /// <summary>
    /// Gets the type of attachment (e.g., "Highlight", "Comment", "Annotation").
    /// </summary>
    public string Type { get; private set; }

    /// <summary>
    /// Gets the location information for the attachment within a document.
    /// </summary>
    public string Location { get; private set; }

    /// <summary>
    /// Gets additional metadata for the attachment.
    /// </summary>
    public string Metadata { get; private set; }

    /// <summary>
    /// Initializes a new instance of the <see cref="FeedbackAttachment"/> class.
    /// </summary>
    /// <param name="referenceId">The reference identifier for the attachment.</param>
    /// <param name="type">The type of attachment.</param>
    /// <param name="location">The location information for the attachment.</param>
    /// <param name="metadata">Additional metadata for the attachment.</param>
    public FeedbackAttachment(string referenceId, string type, string location, string metadata = "")
    {
        ReferenceId = referenceId;
        Type = type;
        Location = location;
        Metadata = metadata;
    }

    /// <summary>
    /// Creates a new instance of <see cref="FeedbackAttachment"/>.
    /// </summary>
    /// <param name="referenceId">The reference identifier for the attachment.</param>
    /// <param name="type">The type of attachment.</param>
    /// <param name="location">The location information for the attachment.</param>
    /// <param name="metadata">Additional metadata for the attachment.</param>
    /// <returns>A new <see cref="FeedbackAttachment"/> instance.</returns>
    public static FeedbackAttachment New(string referenceId, string type, string location, string metadata = "") =>
        new(referenceId, type, location, metadata);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return ReferenceId;
        yield return Type;
        yield return Location;
        yield return Metadata;
    }
}

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

public sealed class PerformanceTag : StringValueObject
{
    [JsonConstructor]
    public PerformanceTag(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static PerformanceTag New(string value) => new(value);
}