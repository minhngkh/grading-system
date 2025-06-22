using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Assessments.Assess;
using AssignmentFlow.Application.Assessments.Create;
using AssignmentFlow.Application.Gradings.Hub;
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;
using Microsoft.AspNetCore.SignalR;
namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSaga : AggregateSaga<GradingSaga, GradingSagaId, GradingSagaLocator>,
    ISagaIsStartedBy<GradingAggregate, GradingId, AutoGradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, Assessments.StartAutoGrading.AutoGradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessedEvent>
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
                RubricId = RubricId.With(gradingSummary.RubricId)
            });
        }

        logger.LogInformation("Completed creating assessments for grading {GradingId}", gradingSummary.Id);
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        // Start tracking the assessment
        Emit(new GradingSagaAssessmentTrackedEvent
        {
            AssessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value),
            SubmissionReference = domainEvent.AggregateEvent.SubmissionReference
        });
        try
        {
            var submission = await repository.GetSubmissionAsync(
                aggregateState.GradingId.Value,
                domainEvent.AggregateEvent.SubmissionReference,
                cancellationToken);

            Publish(new Assessments.StartAutoGrading.Command(domainEvent.AggregateIdentity)
            {
                RubricId = aggregateState.RubricId,
                Submission = submission
            });

            await PublishProgressUpdate();
        }
        catch (Exception ex)
        {
            // Handle the case where the submission is not found
            logger.LogError(ex, "Error starting auto grading for assessment {AssessmentId}", domainEvent.AggregateIdentity.Value);
        }
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, Assessments.StartAutoGrading.AutoGradingStartedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        Emit(new GradingSagaAssessmentAutoGradingStartedEvent
        {
            AssessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value)
        });

        await PublishProgressUpdate();
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        var assessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value);

        // AI Grading should always be the first to assess an assessment
        if (domainEvent.AggregateEvent.Grader.IsAIGrader)
        {
            if (aggregateState.GradedAssessmentIds.Contains(assessmentId))
            {
                logger.LogInformation("Assessment {AssessmentId} is already graded, skipping re-processing.", assessmentId.Value);
                return;
            }
            
            // Emit event to mark this assessment as auto-graded
            Emit(new GradingSagaAssessmentAutoGradingFinishedEvent
            {
                AssessmentId = assessmentId
            });
            
            // Check if all assessments are now graded
            HandleAutoGradingCompletion();
            await PublishProgressUpdate();
        }
    }

    //TODO: Handle the case where some assessments failed to auto-grade

    private void HandleAutoGradingCompletion()
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
            Publish(new CompleteAutoGradingCommand(GradingId.With(aggregateState.GradingId)));
        }
        else
        {
            //TODO: Handle the case where some assessments failed to auto-grade
        }
    }

    private async Task PublishProgressUpdate()
    {
        var progress = new GradingProgress
        {
            GradingId = aggregateState.GradingId,

            PendingAssessmentIds = [.. aggregateState.PendingAssessmentIds.Select(s => s.Value)],
            UnderAutoGradingAssessmentIds = [.. aggregateState.UnderAutoGradingAssessmentIds.Select(s => s.Value)],
            GradedAssessmentIds = [.. aggregateState.GradedAssessmentIds.Select(s => s.Value)]
        };
        
        await hubContext.Clients
            .Group(aggregateState.GradingId.Value)
            .ReceiveGradingProgress(progress);
    }
}
