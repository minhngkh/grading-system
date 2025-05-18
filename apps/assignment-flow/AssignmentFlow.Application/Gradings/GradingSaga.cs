using AssignmentFlow.Application.Assessments;
using AssignmentFlow.Application.Assessments.Create;
using AssignmentFlow.Application.Gradings.Start;
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;
namespace AssignmentFlow.Application.Gradings;

public class GradingSaga : AggregateSaga<GradingSaga, GradingSagaId, GradingSagaLocator>,
    ISagaIsStartedBy<GradingAggregate, GradingId, GradingStartedEvent>,
    ISagaHandles<AssessmentAggregate, AssessmentId, AssessmentCreatedEvent>
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
            GradingId = GradingId.With(gradingSummary.Id),
            TeacherId = TeacherId.With(gradingSummary.TeacherId),
        });

        //We first create empty assessment for each submission
        logger.LogTrace("Creating assessments for grading {GradingId}", gradingSummary.Id);
        foreach (var submission in gradingSummary.Submissions)
        {
            var assessmentId = AssessmentId.NewComb();
            // Create an assessment for each submission
            Publish(new Assessments.Create.Command(assessmentId)
            {
                SubmissionReference = SubmissionReference.New(submission.Reference),
                GradingId = gradingSummary.Id,
                TeacherId = TeacherId.With(gradingSummary.TeacherId)
            });
        }
    }

    public Task HandleAsync(IDomainEvent<AssessmentAggregate, AssessmentId, AssessmentCreatedEvent> domainEvent, ISagaContext sagaContext, CancellationToken cancellationToken)
    {
        // Start tracking the assessment
        Emit(new AssessmentTrackedEvent
        {
            AssessmentId = domainEvent.AggregateIdentity
        });

        return Task.CompletedTask;
    }
}
