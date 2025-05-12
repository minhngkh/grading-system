using AssignmentFlow.IntegrationEvents;

namespace AssignmentFlow.Application.Assessments.Create;

public static class ValueObjectExtensions
{
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