namespace AssignmentFlow.Application.Gradings;

public static class ValueObjectExtensions
{
    public static Selector ToValueObject(this SelectorApiContract apiContract)
    => Selector.New(
            CriterionName.New(apiContract.Criterion),
            Pattern.New(apiContract.Pattern));

    public static Submission ToValueObject(this SubmissionApiContract apiContract)
    {
        var reference = SubmissionReference.New(apiContract.Reference);
        var criteriaFiles = apiContract.CriteriaFiles
            .Select(c =>
                CriterionFiles.New(
                    CriterionName.New(c.Criterion),
                    c.Files.ConvertAll(Attachment.New)))
            .ToHashSet();

        return Submission.New(reference, criteriaFiles);
    }
}
