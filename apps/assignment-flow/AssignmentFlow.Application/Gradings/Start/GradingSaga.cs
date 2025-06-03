using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Assessments.Assess;
using AssignmentFlow.Application.Assessments.Create;
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;
namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSaga : AggregateSaga<GradingSaga, GradingSagaId, GradingSagaLocator>,
    ISagaIsStartedBy<GradingAggregate, GradingId, AutoGradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, Assessments.StartAutoGrading.AutoGradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessedEvent>
{
    private readonly ILogger<GradingSaga> logger;
    private readonly GradingRepository repository;

    private readonly GradingSagaWriteModel aggregateState;

    public GradingSaga(
        GradingSagaId id,
        ILogger<GradingSaga> logger,
        GradingRepository repository) : base(id)
    {
        this.logger = logger;
        this.repository = repository;

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
            GradingId = GradingId.With(gradingSummary.Id),
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
                TeacherId = TeacherId.With(gradingSummary.TeacherId)
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
        }
        catch (Exception ex)
        {
            // Handle the case where the submission is not found
            logger.LogError(ex, "Error starting auto grading for assessment {AssessmentId}", domainEvent.AggregateIdentity.Value);
        }
    }

    public Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, Assessments.StartAutoGrading.AutoGradingStartedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        Emit(new GradingSagaAssessmentAutoGradingStartedEvent
        {
            AssessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value)
        });

        return Task.CompletedTask;
    }

    public Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        if (domainEvent.AggregateEvent.Grader.IsAIGrader)
        {
            Emit(new GradingSagaAssessmentAutoGradingFinishedEvent
            {
                AssessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value)
            });
        }

        HandleAutoGradingCompletion();
        return Task.CompletedTask;
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

        if (aggregateState.FailedAssessmentIds.Count == 0)
        {
            Publish(new CompleteAutoGradingCommand(aggregateState.GradingId));
        }
        else
        {
            //TODO: Handle the case where some assessments failed to auto-grade
        }
    }
}
