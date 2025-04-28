using EventFlow.ValueObjects;

namespace AssignmentFlow.Application.Gradings;

public sealed class Submission : ValueObject
{
    public Dictionary<CriterionName, List<Attachment>> CriteriaFiles { get; }

    private Submission(Dictionary<CriterionName, List<Attachment>> criterionFiles)
    {
        CriteriaFiles = criterionFiles;
    }

    public static Submission New(Dictionary<CriterionName, List<Attachment>> criterionFiles)
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
