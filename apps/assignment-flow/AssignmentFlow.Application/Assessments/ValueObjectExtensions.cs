using AssignmentFlow.IntegrationEvents;
using MassTransit.Internals;
using System.Text.Json;

namespace AssignmentFlow.Application.Assessments;

public static class ValueObjectExtensions
{
    public static ScoreBreakdowns ToValueObject(this IEnumerable<ScoreBreakdownApiContract> apiContracts)
        => ScoreBreakdowns.New(apiContracts
            .ToDictionary(
            a => CriterionName.New(a.CriterionName),
            a => a.ToValueObject()));

    public static ScoreBreakdownItem ToValueObject(this ScoreBreakdownApiContract apiContract)
    {
        var criterionName = CriterionName.New(apiContract.CriterionName);
        return new ScoreBreakdownItem(criterionName)
        {
            RawScore = Percentage.New(apiContract.RawScore),
            PerformanceTag = PerformanceTag.New(apiContract.PerformanceTag),
            MetadataJson = apiContract.MetadataJson
        };
    }

    public static Feedback ToValueObject(this FeedbackItemApiContract apiContract)
        => Feedback.New(
            CriterionName.New(apiContract.Criterion),
            Comment.New(apiContract.Comment),
            Highlight.New(
                Attachment.New(apiContract.FileRef),
                string.IsNullOrEmpty(apiContract.LocationDataJson) ? JsonSerializer.Serialize(apiContract.LocationData) : apiContract.LocationDataJson
            ),
            Tag.New(apiContract.Tag));

    public static (ScoreBreakdownItem, List<Feedback>) ToValueObject(this ScoreBreakdownV2 apiContract, string criterion, Dictionary<string, object?> metadata)
    {
        var criterionName = CriterionName.New(criterion);

        var breakdownItem = new ScoreBreakdownItem(criterionName)
        {
            RawScore = Percentage.New(apiContract.RawScore),
            PerformanceTag = PerformanceTag.New(apiContract.Tag),
            MetadataJson = JsonSerializer.Serialize(metadata)
        };
        var feedbackItems = apiContract.FeedbackItems.ConvertAll(fb => fb.ToValueObject(criterionName));

        return (breakdownItem, feedbackItems);
    }

    public static Feedback ToValueObject(this FeedbackItemV2 apiContract, CriterionName criterion)
    {
        var comment = Comment.New(apiContract.Comment);

        var locationDataJson = JsonSerializer.Serialize(apiContract.LocationData);
        var attachment = Attachment.New(apiContract.FileRef);
        var feedbackAttachment = Highlight.New(attachment, locationDataJson);

        var feedbackTag = Tag.New(apiContract.Tag);

        return Feedback.New(criterion, comment, feedbackAttachment, feedbackTag);
    }

    // Legacy conversion methods for backwards compatibility
    public static (ScoreBreakdowns, List<Feedback>) ToValueObject(this IEnumerable<ScoreBreakdown> apiContracts)
    {
        var results = apiContracts
            .Select(contract => contract.ToValueObject())
            .ToList();

        var scoreBreakdownItems = results.ConvertAll(result => result.Item1);
        var allFeedback = results.SelectMany(result => result.Item2).ToList();

        return (ScoreBreakdowns.New(scoreBreakdownItems.ToDictionary(s => s.CriterionName, s => s)), allFeedback);
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

        var locationData = new Dictionary<string, object?>
        {
            ["fromLine"] = apiContract.FromLine,
            ["toLine"] = apiContract.ToLine,
            ["fromCol"] = apiContract.FromCol,
            ["toCol"] = apiContract.ToCol
        };
        var locationDataJson = JsonSerializer.Serialize(locationData);
        var attachment = Attachment.New(apiContract.FileRef);
        var feedbackAttachment = Highlight.New(attachment, locationDataJson);

        var feedbackTag = Tag.New(apiContract.Tag);

        return Feedback.New(criterion, comment, feedbackAttachment, feedbackTag);
    }
}
