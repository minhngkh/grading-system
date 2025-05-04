using AssignmentFlow.IntegrationEvents;

namespace AssignmentFlow.Application.Assessments;

public static class ValueObjectExtensions
{
    public static ScoreBreakdowns ToScoreBreakdowns(this IEnumerable<ScoreBreakdownApiContract> apiContracts)
        => ScoreBreakdowns.New([.. apiContracts.Select(ToScoreBreakdownItem)]);

    public static ScoreBreakdowns ToScoreBreakdowns(this IEnumerable<ScoreBreakdownDto> dtos)
        => ScoreBreakdowns.New([.. dtos.Select(ToScoreBreakdownItem)]);

    public static ScoreBreakdownItem ToScoreBreakdownItem(this ScoreBreakdownApiContract apiContract)
    {
        return new ScoreBreakdownItem(
            CriterionName.New(apiContract.CriterionName))
            {
                RawScore = Percentage.New(apiContract.RawScore),
                PerformanceTag = PerformanceTag.New(apiContract.PerformanceTag)
            };
    }

    public static ScoreBreakdownItem ToScoreBreakdownItem(this ScoreBreakdownDto dto)
    {
        return new ScoreBreakdownItem(
            CriterionName.New(dto.CriterionName))
        {
            RawScore = Percentage.New(dto.RawScore),
            PerformanceTag = PerformanceTag.New(dto.PerformanceTag)
        };
    }

    public static Feedback ToFeedback(this FeedbackItemApiContract apiContract)
        => Feedback.New(
            CriterionName.New(apiContract.Criterion),
            Comment.New(apiContract.Comment),
            FeedbackAttachment.New(
                Attachment.New(apiContract.FileRef),
                DocumentLocation.New(apiContract.FromLine, apiContract.ToLine, apiContract.FromCol, apiContract.ToCol)),
            Tag.New(apiContract.Tag));

    public static Feedback ToFeedback(this FeedbackItemDto dto)
        => Feedback.New(
            CriterionName.New(dto.Criterion),
            Comment.New(dto.Comment),
            FeedbackAttachment.New(
                Attachment.New(dto.FileRef),
                DocumentLocation.New(dto.FromLine, dto.ToLine, dto.FromCol, dto.ToCol)),
            Tag.New(dto.Tag));
}