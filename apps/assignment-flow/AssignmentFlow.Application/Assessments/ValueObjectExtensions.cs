using AssignmentFlow.IntegrationEvents;

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

    public static (ScoreBreakdowns, List<Feedback>) ToValueObject(this IEnumerable<ScoreBreakdown> apiContracts)
    {
        var results = apiContracts
            .Select(contract => contract.ToValueObject())
            .ToList();

        var scoreBreakdownItems = results.ConvertAll(result => result.Item1);
        var allFeedback = results.SelectMany(result => result.Item2).ToList();

        return (ScoreBreakdowns.New(scoreBreakdownItems), allFeedback);
    }

    public static (ScoreBreakdownItem, List<Feedback>) ToValueObject(this ScoreBreakdown apiContract)
    {
        var criterionName = CriterionName.New(apiContract.CriterionName);

        return (new ScoreBreakdownItem(criterionName)
        {
            RawScore = Percentage.New(apiContract.RawScore),
            PerformanceTag = PerformanceTag.New(apiContract.Tag)
        },
            apiContract.FeedbackItems.ConvertAll(fb => fb.ToValueObject(criterionName)));
    }

    public static Feedback ToValueObject(this FeedbackItem apiContract, CriterionName criterion)
    {
        var comment = Comment.New(apiContract.Comment);

        var documentLocation = DocumentLocation.New(
            apiContract.FromLine,
            apiContract.ToLine,
            apiContract.FromCol,
            apiContract.ToCol);
        var attachment = Attachment.New(apiContract.FileRef);
        var feedbackAttachment = Highlight.New(attachment, documentLocation);

        var feedbackTag = Tag.New(apiContract.Tag);

        return Feedback.New(criterion, comment, feedbackAttachment, feedbackTag);
    }
}