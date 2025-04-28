using EventFlow.ValueObjects;

namespace AssignmentFlow.Application.Grading;

/// <summary>
/// Represents a submission reference for grading, storing basic blob info and
/// a mapping from each criterion to a list of related blob references.
/// </summary>
public sealed class Submission : ValueObject
{
    /// <summary>
    /// Associates each criterion with one or more blob references.
    /// </summary>
    public Dictionary<CriterionIdentity, List<Attachment>> CriteriaFiles { get; }

    private Submission(Dictionary<CriterionIdentity, List<Attachment>> criterionFiles)
    {
        CriteriaFiles = criterionFiles;
    }

    /// <summary>
    /// Creates a new Submission value object.
    /// </summary>
    public static Submission New(Dictionary<CriterionIdentity, List<Attachment>> criterionFiles)
        => new (criterionFiles);

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        foreach (var kvp in CriteriaFiles)
        {
            yield return kvp.Key;
            foreach (var blobRef in kvp.Value)
            {
                yield return blobRef;
            }
        }
    }
}

public sealed class CriteriaFilesMapping : ValueObject
{
    public CriterionIdentity Identity { get; }
    public ContentSelectorStrategy ContentSelectorStrategy { get; }
}

public sealed class ContentSelectorStrategy : ValueObject
{
    public string Name { get; private set; } = string.Empty;
    private ContentSelectorStrategy(string name)
    {
        Name = name;
    }
    public static ContentSelectorStrategy New(string name) => new(name);
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Name;
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
