namespace AssignmentFlow.Application.Assessments;

public static class ValueObjectExtensions
{
    public static ScoreBreakdowns ToValueObject(this IEnumerable<ScoreBreakdownApiContract> apiContracts)
        => ScoreBreakdowns.New([.. apiContracts.Select(ToValueObject)]);

    public static ScoreBreakdownItem ToValueObject(this ScoreBreakdownApiContract apiContract)
    {
        return new ScoreBreakdownItem(
            CriterionName.New(apiContract.CriterionName))
            {
                RawScore = Percentage.New(apiContract.RawScore),
                PerformanceTag = PerformanceTag.New(apiContract.PerformanceTag)
            };
    }

    public static Feedback ToValueObject(this FeedbackItemApiContract apiContract)
        => Feedback.New(
            CriterionName.New(apiContract.Criterion),
            Comment.New(apiContract.Comment),
            Highlight.New(
                Attachment.New(apiContract.FileRef),
                DocumentLocation.New(apiContract.FromLine, apiContract.ToLine, apiContract.FromCol, apiContract.ToCol)),
            Tag.New(apiContract.Tag));
}