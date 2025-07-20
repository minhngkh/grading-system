using AssignmentFlow.IntegrationEvents;
using System.Text.Json;

namespace AssignmentFlow.Application.Assessments;

public static class ValueObjectExtensions
{
    public static ScoreBreakdowns ToValueObject(this IEnumerable<ScoreBreakdownApiContract> apiContracts)
    => ScoreBreakdowns.New([.. apiContracts.Select(s => s.ToValueObject())]);

    public static ScoreBreakdowns ToValueObject(this IEnumerable<ScoreBreakdownApiContract> apiContracts, Grader grader)
        => ScoreBreakdowns.New([.. apiContracts.Select(s => s.ToValueObject(grader))]);

    public static ScoreBreakdownItem ToValueObject(this ScoreBreakdownApiContract apiContract, Grader? grader = null)
    {
        var criterionName = CriterionName.New(apiContract.CriterionName);
        return new ScoreBreakdownItem(criterionName)
        {
            RawScore = Percentage.New(apiContract.RawScore),
            PerformanceTag = PerformanceTag.New(apiContract.PerformanceTag),
            MetadataJson = apiContract.MetadataJson,
            Grader = grader ?? Grader.New(apiContract.Grader),
            Status = "Graded"
        };
    }

    public static Feedback ToValueObject(this FeedbackItemApiContract apiContract)
        => Feedback.New(
            FeedbackIdentity.New(apiContract.Id),
            CriterionName.New(apiContract.Criterion),
            Comment.New(apiContract.Comment),
            Highlight.New(
                Attachment.New(apiContract.FileRef),
                string.IsNullOrEmpty(apiContract.LocationDataJson) ? JsonSerializer.Serialize(apiContract.LocationData) : apiContract.LocationDataJson
            ),
            Tag.New(apiContract.Tag));

    public static (ScoreBreakdownItem, List<Feedback>) ToValueObject(
        this ScoreBreakdownV2 apiContract,
        string criterion,
        Grader grader,
        Dictionary<string, object?> metadata,
        ISequenceRepository<Feedback> sequenceRepository)
    {
        var criterionName = CriterionName.New(criterion);

        var breakdownItem = new ScoreBreakdownItem(criterionName)
        {
            RawScore = Percentage.New(apiContract.RawScore),
            PerformanceTag = PerformanceTag.New(apiContract.Tag),
            MetadataJson = JsonSerializer.Serialize(metadata),
            Grader = grader
        };

        List<Feedback> feedbackItems = [];
        if (!string.IsNullOrEmpty(apiContract.Summary))
        {
            var summary = Feedback.Summary(
                FeedbackIdentity.New(sequenceRepository.GenerateSequence().Result),
                criterionName,
                Comment.New(apiContract.Summary));
            feedbackItems.Add(summary);
        }
        feedbackItems.AddRange(apiContract.FeedbackItems
            .Select(fb => fb.ToValueObject(criterionName, sequenceRepository)));

        return (breakdownItem, feedbackItems);
    }

    public static Feedback ToValueObject(
        this FeedbackItemV2 apiContract,
        CriterionName criterion,
        ISequenceRepository<Feedback> sequenceRepository)
    {
        var identity = FeedbackIdentity.New(sequenceRepository.GenerateSequence().Result);

        var comment = Comment.New(apiContract.Comment);

        var locationDataJson = JsonSerializer.Serialize(apiContract.LocationData);
        var attachment = Attachment.New(apiContract.FileRef);
        var feedbackAttachment = Highlight.New(attachment, locationDataJson);

        var feedbackTag = Tag.New(apiContract.Tag);

        return Feedback.New(identity, criterion, comment, feedbackAttachment, feedbackTag);
    }

    [Obsolete("Obsoleted because the target model have been obsolete")]
    public static (ScoreBreakdowns, List<Feedback>) ToValueObject(this IEnumerable<ScoreBreakdown> apiContracts)
    {
        var results = apiContracts
            .Select(contract => contract.ToValueObject())
            .ToList();

        var scoreBreakdownItems = results.ConvertAll(result => result.Item1);
        var allFeedback = results.SelectMany(result => result.Item2).ToList();

        return (ScoreBreakdowns.New(scoreBreakdownItems), allFeedback);
    }

    [Obsolete]
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

    [Obsolete]
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

        return Feedback.New(FeedbackIdentity.Empty, criterion, comment, feedbackAttachment, feedbackTag);
    }
}
