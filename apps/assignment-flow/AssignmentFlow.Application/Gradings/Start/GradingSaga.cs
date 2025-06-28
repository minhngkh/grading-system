using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Assessments.Assess;
using AssignmentFlow.Application.Assessments.Create;
using AssignmentFlow.Application.Assessments.Hub;
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;
using Microsoft.AspNetCore.SignalR;
namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSaga : AggregateSaga<GradingSaga, GradingSagaId, GradingSagaLocator>,
    ISagaIsStartedBy<GradingAggregate, GradingId, AutoGradingStartedEvent>,
    ISagaHandles<GradingAggregate, GradingId, AutoGradingRestartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, Assessments.AutoGrading.AutoGradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, Assessments.AutoGrading.AutoGradingFinishedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessmentFailedEvent>
{
    private readonly ILogger<GradingSaga> logger;
    private readonly GradingRepository repository;
    private readonly IHubContext<GradingsHub, IGradingClient> hubContext;

    private readonly GradingSagaWriteModel aggregateState;

    public GradingSaga(
        GradingSagaId id,
        ILogger<GradingSaga> logger,
        GradingRepository repository,
        IHubContext<GradingsHub, IGradingClient> hubContext) : base(id)
    {
        this.logger = logger;
        this.repository = repository;
        this.hubContext = hubContext;

        aggregateState = new GradingSagaWriteModel();
        Register(aggregateState);
    }

    public async Task HandleAsync(
        IDomainEvent<GradingAggregate, GradingId, AutoGradingStartedEvent> domainEvent,
        ISagaContext sagaContext,
        CancellationToken cancellationToken)
    {
        var gradingSummary = await repository
            .GetGradingSummary(domainEvent.AggregateIdentity.Value, cancellationToken);

        Emit(new GradingSagaStartedEvent
        {
            RubricId = RubricId.With(gradingSummary.RubricId),
            GradingId = Shared.GradingId.With(gradingSummary.Id),
            TeacherId = TeacherId.With(gradingSummary.TeacherId),
            SubmissionReferences = [.. gradingSummary.Submissions
                .Select(s => SubmissionReference.New(s.Reference))]
        });

        //We first create empty assessment for each submission
        logger.LogInformation("Creating assessments for grading {GradingId}", gradingSummary.Id);
        foreach (var submission in gradingSummary.Submissions)
        {
            var assessmentId = Assessments.AssessmentId.NewComb();
            // Create an assessment for each submission
            Publish(new Assessments.Create.Command(assessmentId)
            {
                SubmissionReference = SubmissionReference.New(submission.Reference),
                GradingId = Shared.GradingId.With(gradingSummary.Id),
                TeacherId = TeacherId.With(gradingSummary.TeacherId),
                RubricId = RubricId.With(gradingSummary.RubricId),
                Criteria = [.. submission.CriteriaFiles.Select(cf => CriterionName.New(cf.Criterion))]
            });
        }

        logger.LogInformation("Completed creating assessments for grading {GradingId}", gradingSummary.Id);
    }

    // This method is called when the grading is re-started, e.g., after a failure or manual intervention
    // We don't need to re-create assessments, just re-start the auto-grading process
    public async Task HandleAsync(IDomainEvent<GradingAggregate, GradingId, AutoGradingRestartedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        logger.LogInformation("Re-starting grading saga for GradingId {GradingId}", domainEvent.AggregateIdentity.Value);

        var assessmentToRegrade = aggregateState.GradedAssessmentIds
            .Union(aggregateState.FailedAssessmentIds)
            .ToHashSet();

        foreach (var assessmentId in assessmentToRegrade)
        {
            var submission = await repository.GetSubmissionAsync(
                aggregateState.GradingId.Value,
                aggregateState.AssessmentToSubmissionRefs[assessmentId],
                cancellationToken);

            Publish(new Assessments.AutoGrading.StartAutoGradingCommand(Assessments.AssessmentId.With(assessmentId))
            {
                RubricId = aggregateState.RubricId,
                Submission = submission
            });

            // Update the progress for the assessment
            await PublishProgressUpdate(new AssessmentProgress
            {
                SubmissionReference = submission.Reference,
                AssessmentId = assessmentId,
                Status = AssessmentState.AutoGradingStarted.ToString(),
                ErrorMessage = null
            });
        }
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        var assessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value);
        // Start tracking the assessment
        Emit(new GradingSagaAssessmentTrackedEvent
        {
            AssessmentId = assessmentId,
            SubmissionReference = domainEvent.AggregateEvent.SubmissionReference
        });
        try
        {
            var submission = await repository.GetSubmissionAsync(
                aggregateState.GradingId.Value,
                domainEvent.AggregateEvent.SubmissionReference,
                cancellationToken);

            Publish(new Assessments.AutoGrading.StartAutoGradingCommand(domainEvent.AggregateIdentity)
            {
                RubricId = aggregateState.RubricId,
                Submission = submission
            });

            await PublishProgressUpdate(new AssessmentProgress
            {
                SubmissionReference = domainEvent.AggregateEvent.SubmissionReference,
                AssessmentId = assessmentId,
                Status = AssessmentState.Created.ToString(),
                ErrorMessage = null
            });
        }
        catch (Exception ex)
        {
            // Handle the case where the submission is not found
            logger.LogError(ex, "Error starting auto grading for assessment {AssessmentId}", assessmentId);
        }
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, Assessments.AutoGrading.AutoGradingStartedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        var assessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value);

        // When auto-grading starts, we clear all previous state related to this assessment
        Emit(new GradingSagaAssessmentAutoGradingStartedEvent
        {
            AssessmentId = assessmentId
        });

        await PublishProgressUpdate(new AssessmentProgress
        {
            SubmissionReference = aggregateState.AssessmentToSubmissionRefs[assessmentId],
            AssessmentId = assessmentId,
            Status = AssessmentState.AutoGradingStarted.ToString(),
            ErrorMessage = null
        });
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        if (!domainEvent.AggregateEvent.Grader.IsAIGrader)
        {
            return; // This only handles AI grading
        }

        var assessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value);
        // Emit event to mark this assessment as auto-graded
        Emit(new GradingSagaAssessmentAutoGradingFinishedEvent
        {
            AssessmentId = assessmentId
        });
            
        // Check if all assessments are now graded
        await HandleAutoGradingCompletion();
        
        await PublishProgressUpdate(new AssessmentProgress
        {
            SubmissionReference = aggregateState.AssessmentToSubmissionRefs[assessmentId],
            AssessmentId = assessmentId,
            Status = AssessmentState.AutoGradingFinished.ToString(),
            ErrorMessage = null
        });
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessmentFailedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        var assessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value);
        Emit(new GradingSagaAssessmentAutoGradingFailedEvent
        {
            AssessmentId = assessmentId
        });

        await PublishProgressUpdate(new AssessmentProgress
        {
            SubmissionReference = aggregateState.AssessmentToSubmissionRefs[assessmentId],
            AssessmentId = assessmentId,
            Status = AssessmentState.AutoGradingFailed.ToString(),
            ErrorMessage = string.Join("; ", domainEvent.AggregateEvent.Errors.Select(e => $"{e.Key}: {e.Value}"))
        });
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, Assessments.AutoGrading.AutoGradingFinishedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        var assessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value);
        // Emit event to mark this assessment as auto-graded
        Emit(new GradingSagaAssessmentAutoGradingFinishedEvent
        {
            AssessmentId = assessmentId
        });

        // Check if all assessments are now graded
        await HandleAutoGradingCompletion();

        await PublishProgressUpdate(new AssessmentProgress
        {
            SubmissionReference = aggregateState.AssessmentToSubmissionRefs[assessmentId],
            AssessmentId = assessmentId,
            Status = AssessmentState.AutoGradingFinished.ToString(),
            ErrorMessage = null
        });
    }

    private async Task HandleAutoGradingCompletion()
    {
        if (aggregateState.PendingSubmissionRefs.Count > 0)
        {
            return;
        }

        if (aggregateState.PendingAssessmentIds.Count > 0)
        {
            return;
        }

        if (aggregateState.UnderAutoGradingAssessmentIds.Count > 0)
        {
            return;
        }

        if (aggregateState.FailedAssessmentIds.Count == 0)
        {
            logger.LogInformation("All assessments auto-graded for grading {GradingId}", aggregateState.GradingId.Value);
            Publish(new CompleteAutoGradingCommand(GradingId.With(aggregateState.GradingId)));
            await hubContext.Clients
                .Group(aggregateState.GradingId.Value)
                .Complete();
        }
        else
        {
            //TODO: Handle the case where some assessments failed to auto-grade
        }
    }

    private async Task PublishProgressUpdate(AssessmentProgress progress)
    {
        //TODO: Cache the current progress state to avoid unnecessary database calls

        await hubContext.Clients
            .Group(aggregateState.GradingId.Value)
            .ReceiveAssessmentProgress(progress);

        logger.LogInformation("Progress updated for assessment {AssessmentId} with status {Status}", progress.AssessmentId, progress.Status);
    }
}
