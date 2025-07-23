using AssignmentFlow.Application.Assessments.AutoGrading;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Assessments;

public class Assessment
    : Identifiable<string>,
    IReadModel,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, Create.AssessmentCreatedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AutoGrading.AutoGradingStartedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AutoGrading.AutoGradingFinishedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, Assess.AssessedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, Assess.AssessmentFailedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AutoGrading.CriterionAssessedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, UpdateFeedBack.FeedbacksUpdatedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AutoGrading.ManualGradingRequestedEvent>,
    IAmReadModelFor<AssessmentAggregate, AssessmentId, AutoGrading.AssessmentGradingCompletedEvent>
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

    [HasMany]
    public List<ScoreAdjustment> ScoreAdjustmentsHistory { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public DateTimeOffset LastModified { get; set; }

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public DateTimeOffset CreatedAt { get; set; }

    [Attr(Capabilities = AllowView)]
    public int Version { get; private set; }

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string Status { get; set; } = nameof(AssessmentState.Created);
    public AssessmentStateMachine StateMachine => new(() => Enum.Parse<AssessmentState>(Status), AfterStateUpdated);
    private void AfterStateUpdated(AssessmentState newState) => Status = Enum.GetName(newState) ?? throw new InvalidOperationException();

    public bool IsActionAllowed(string action) => StateMachine.PermittedTriggers.Any(a => Enum.GetName(a) == action);

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, Create.AssessmentCreatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId.Value;
        GradingId = domainEvent.AggregateEvent.GradingId;
        SubmissionReference = domainEvent.AggregateEvent.SubmissionReference;

        ScoreBreakdowns = domainEvent.AggregateEvent.InitialScoreBreakdowns.ToApiContracts();
        RawScore = domainEvent.AggregateEvent.InitialScoreBreakdowns.TotalRawScore;

        CreatedAt = domainEvent.Timestamp.ToUniversalTime();
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AutoGrading.AutoGradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        StateMachine.Fire(AssessmentTrigger.StartAutoGrading);
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, Assess.AssessmentFailedEvent> domainEvent, CancellationToken cancellationToken)
    {
        StateMachine.Fire(AssessmentTrigger.CancelAutoGrading);
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, Assess.AssessedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var oldScore = ScoreBreakdowns.ToValueObject();
        var newScore = domainEvent.AggregateEvent.ScoreBreakdowns;
        var deltaScore = newScore - oldScore;

        ScoreBreakdowns = domainEvent.AggregateEvent.ScoreBreakdowns.ToApiContracts();
        RawScore = domainEvent.AggregateEvent.ScoreBreakdowns.TotalRawScore;
        ScoreAdjustmentsHistory.Add(new ScoreAdjustment
        {
            Id = ScoreAdjustmentId.NewComb().Value,
            Assessment = this,
            GradingId = GradingId,
            TeacherId = TeacherId,
            AdjustmentSource = domainEvent.AggregateEvent.Grader,
            Score = newScore.TotalRawScore,
            ScoreBreakdowns = newScore.ToApiContracts(),
            DeltaScore = deltaScore.TotalRawScore,
            DeltaScoreBreakdowns = deltaScore.ToApiContracts(),
            CreatedAt = DateTimeOffset.UtcNow
        });

        if (domainEvent.AggregateEvent.Grader == Grader.AIGrader)
        {
            StateMachine.Fire(AssessmentTrigger.FinishAutoGrading);
        }

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, UpdateFeedBack.FeedbacksUpdatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        Feedbacks = domainEvent.AggregateEvent.Feedbacks.ToApiContracts();
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    private void UpdateLastModifiedData(IDomainEvent domainEvent)
    {
        LastModified = domainEvent.Timestamp.ToUniversalTime();
        Version = domainEvent.AggregateSequenceNumber;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AutoGrading.CriterionAssessedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var breakdownItem = domainEvent.AggregateEvent.ScoreBreakdownItem.ToApiContract();
        
        // Update or add the breakdown item
        var existingItem = ScoreBreakdowns.FirstOrDefault(b => b.CriterionName == breakdownItem.CriterionName);
        if (existingItem != null)
        {
            ScoreBreakdowns.Remove(existingItem);
        }
        ScoreBreakdowns.Add(breakdownItem);
        RawScore = ScoreBreakdowns.Sum(s => s.RawScore);

        if (ScoreBreakdowns.ToValueObject().IsCompleted)
        {
            var oldScore = ScoreAdjustmentsHistory.LastOrDefault()?.ScoreBreakdowns.ToValueObject();
            var newScore = ScoreBreakdowns.ToValueObject();
            var deltaScore = newScore - oldScore;

            ScoreAdjustmentsHistory.Add(new ScoreAdjustment
            {
                Id = ScoreAdjustmentId.NewComb().Value,
                Assessment = this,
                GradingId = GradingId,
                TeacherId = TeacherId,
                AdjustmentSource = Grader.AIGrader,
                Score = newScore.TotalRawScore,
                ScoreBreakdowns = newScore.ToApiContracts(),
                DeltaScore = deltaScore.TotalRawScore,
                DeltaScoreBreakdowns = deltaScore.ToApiContracts(),
                CreatedAt = DateTimeOffset.UtcNow
            });

            StateMachine.Fire(AssessmentTrigger.FinishAutoGrading);
        }

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AutoGrading.AutoGradingFinishedEvent> domainEvent, CancellationToken cancellationToken)
    {
        StateMachine.Fire(AssessmentTrigger.FinishAutoGrading);
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, ManualGradingRequestedEvent> domainEvent, CancellationToken cancellationToken)
    {
        StateMachine.Fire(AssessmentTrigger.WaitForManualGrading);
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<AssessmentAggregate, AssessmentId, AssessmentGradingCompletedEvent> domainEvent, CancellationToken cancellationToken)
    {
        StateMachine.Fire(AssessmentTrigger.Complete);
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }
}
