using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AssignmentFlow.Application.Assessments.Create;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;

using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Assessments;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class Assessment
    : Identifiable<string>,
    IReadModel,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AssessmentCreatedEvent>
{
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public override string Id { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string TeacherId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string GradingId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string SubmissionReference { get; set; } = string.Empty;

    /// <summary>
    /// The final score after applying the scale factor.
    /// </summary>
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [NotMapped]
    public decimal Score => RawScore * ScaleFactor;

    /// <summary>
    /// The scale factor (e.g., 100 for a 0–100 scale, 5 for a 0–5 scale) applied at time of scoring.
    /// </summary>
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal ScaleFactor { get; set; }

    /// <summary>
    /// Gets or sets the raw score as a percentage (e.g., 84.5 for 84.5%).
    /// This value represents the unscaled achievement for this criterion or assessment.
    /// </summary>
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal RawScore { get; set; }
    
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public int AdjustedCount { get; set; } = 0;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<ScoreBreakdownApiContract> ScoreBreakdowns { get; set; } = [];

    [Attr(Capabilities = AllowView)]
    public List<FeedbackItemApiContract> Feedbacks { get; set; } = [];

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AssessmentCreatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId.Value;
        GradingId = domainEvent.AggregateEvent.GradingId;
        ScoreBreakdowns = MapScoreBreakdowns(domainEvent.AggregateEvent.ScoreBreakdowns.Value);
        Feedbacks = MapFeedbacks(domainEvent.AggregateEvent.Feedbacks);
        return Task.CompletedTask;
    }

    private static List<ScoreBreakdownApiContract> MapScoreBreakdowns(List<ScoreBreakdownItem> scoreBreakdowns)
    {
        return scoreBreakdowns.ConvertAll(sb => new ScoreBreakdownApiContract
        {
            CriterionName = sb.CriterionName,
            PerformanceTag = sb.PerformanceTag,
            RawScore = sb.RawScore
        });
    }

    private static List<FeedbackItemApiContract> MapFeedbacks(List<Feedback> feedbacks)
    {
        return feedbacks.ConvertAll(fb => new FeedbackItemApiContract
        {
            Criterion = fb.Criterion,
            Comment = fb.Comment,
            FileRef = fb.Highlight.Attachment,
            FromCol = fb.Highlight.Location.FromColumn,
            FromLine = fb.Highlight.Location.FromLine,
            ToCol = fb.Highlight.Location.ToColumn,
            ToLine = fb.Highlight.Location.ToLine,
            Tag = fb.Tag,
        });
    }
}