using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AssignmentFlow.Application.Assessments.Assess;
using AssignmentFlow.Application.Assessments.Create;
using AssignmentFlow.Application.Assessments.StartAutoGrading;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;

using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Assessments;

public class Assessment
    : Identifiable<string>,
    IReadModel,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AssessmentCreatedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AutoGradingStartedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AssessedEvent>
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
    [MaxLength(ModelConstants.ShortMediumText)]
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

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public DateTimeOffset LastModified { get; set; }

    [Attr(Capabilities = AllowView)]
    public int Version { get; private set; }

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string Status { get; set; } = nameof(AssessmentState.Created);
    public AssessmentStateMachine StateMachine => new(() => Enum.Parse<AssessmentState>(Status), AfterStateUpdated);
    private void AfterStateUpdated(AssessmentState newState) => Status = Enum.GetName(newState) ?? throw new InvalidOperationException();

    public bool IsActionAllowed(string action) => StateMachine.PermittedTriggers.Any(a => Enum.GetName(a) == action);

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AssessmentCreatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId.Value;
        GradingId = domainEvent.AggregateEvent.GradingId;
        SubmissionReference = domainEvent.AggregateEvent.SubmissionReference;

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AutoGradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        StateMachine.Fire(AssessmentTrigger.StartAutoGrading);
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AssessedEvent> domainEvent, CancellationToken cancellationToken)
    {
        ScoreBreakdowns = domainEvent.AggregateEvent.ScoreBreakdowns.ToApiContracts();
        RawScore = domainEvent.AggregateEvent.ScoreBreakdowns.TotalRawScore;
        if (domainEvent.AggregateEvent.Feedbacks != null)
        {
            Feedbacks = domainEvent.AggregateEvent.Feedbacks.ToApiContracts();
        }

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    private void UpdateLastModifiedData(IDomainEvent domainEvent)
    {
        LastModified = domainEvent.Timestamp.ToUniversalTime();
        Version = domainEvent.AggregateSequenceNumber;
    }
}
