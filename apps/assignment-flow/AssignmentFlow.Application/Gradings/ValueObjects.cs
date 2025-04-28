using EventFlow.ValueObjects;

namespace AssignmentFlow.Application.Gradings;

public sealed class Submission : ValueObject
{
    public Dictionary<CriterionIdentity, List<Attachment>> CriteriaFiles { get; }

    private Submission(Dictionary<CriterionIdentity, List<Attachment>> criterionFiles)
    {
        CriteriaFiles = criterionFiles;
    }

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
    public CriterionIdentity Identity { get; private set; }
    public ContentSelector ContentSelector { get; private set; }

    private CriteriaFilesMapping(CriterionIdentity identity, ContentSelector contentSelector)
    {
        Identity = identity;
        ContentSelector = contentSelector;
    }

    public static CriteriaFilesMapping New(CriterionIdentity identity, ContentSelector contentSelector)
        => new (identity, contentSelector);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Identity;
        yield return ContentSelector;   
    }
}

public sealed class CriterionIdentity : ValueObject
{
    public string RubricId { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public CriterionIdentity(string rubricId, string name)
    {
        RubricId = rubricId;
        Name = name;
    }

    public static CriterionIdentity New(string rubricId, string name) => new(rubricId, name);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return RubricId;
        yield return Name;
    }
}

public sealed class ContentSelector : ValueObject
{
    public string Strategy { get; private set; }
    public string Pattern { get; private set; } = string.Empty;

    private ContentSelector(string strategy, string pattern)
    {
        Strategy = strategy;
        Pattern = pattern;
    }

    public static ContentSelector New(string strategy, string pattern) => new(strategy, pattern);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Strategy;
        yield return Pattern;
    }
}