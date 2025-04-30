using AssignmentFlow.Application.Shared;
using AssignmentFlow.IntegrationEvents;

namespace AssignmentFlow.Application.Assessments;

public static class ValueObjectExtensions
{
    public static ScoreBreakdowns ToScoreBreakdowns(this IEnumerable<ScoreBreakdownApiContract> dtos)
        => ScoreBreakdowns.New([.. dtos.Select(ToScoreBreakdownItem)]);

    public static ScoreBreakdowns ToScoreBreakdowns(this IEnumerable<ScoreBreakdownDto> dtos)
        => ScoreBreakdowns.New([.. dtos.Select(ToScoreBreakdownItem)]);

    public static ScoreBreakdownItem ToScoreBreakdownItem(this ScoreBreakdownApiContract dto)
    {
        return new ScoreBreakdownItem(
            CriterionName.New(dto.CriterionName))
            {
                Score = Score.New(dto.Score),
                PerformanceTag = PerformanceTag.New(dto.PerformanceTag),
                Feedbacks = [.. dto.FeedbackItems.Select(ToFeedback)]
            };
    }

    public static ScoreBreakdownItem ToScoreBreakdownItem(this ScoreBreakdownDto dto)
    {
        return new ScoreBreakdownItem(
            CriterionName.New(dto.CriterionName))
        {
            Score = Score.New(dto.Score),
            PerformanceTag = PerformanceTag.New(dto.PerformanceTag),
            Feedbacks = [.. dto.FeedbackItems.Select(ToFeedback)]
        };
    }

    public static Feedback ToFeedback(this FeedbackItemApiContract dto)
        => Feedback.New(dto.Comment,
            FeedbackAttachment.CreateHighlight(
                dto.FileRef, dto.FromLine, dto.ToLine, dto.FromCol, dto.ToCol));

    public static Feedback ToFeedback(this FeedbackItemDto dto)
    => Feedback.New(dto.Comment,
        FeedbackAttachment.CreateHighlight(
            dto.FileRef, dto.FromLine, dto.ToLine, dto.FromCol, dto.ToCol));
}
