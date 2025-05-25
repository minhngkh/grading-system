using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Assessments.Create;
using AssignmentFlow.Application.Gradings.Start;
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;
namespace AssignmentFlow.Application.Gradings;

public class GradingSaga : AggregateSaga<GradingSaga, GradingSagaId, GradingSagaLocator>,
    ISagaIsStartedBy<GradingAggregate, GradingId, GradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent>
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
        IDomainEvent<GradingAggregate, GradingId, GradingStartedEvent> domainEvent,
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
        });

        //We first create empty assessment for each submission
        logger.LogTrace("Creating assessments for grading {GradingId}", gradingSummary.Id);
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
    }

    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, Assessments.AssessmentId, AssessmentCreatedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        // Start tracking the assessment
        Emit(new AssessmentTrackedEvent
        {
            AssessmentId = Shared.AssessmentId.With(domainEvent.AggregateIdentity.Value)
        });
        try
        {
            var submission = await repository.GetSubmissionAsync(
                aggregateState.GradingId,
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
}
