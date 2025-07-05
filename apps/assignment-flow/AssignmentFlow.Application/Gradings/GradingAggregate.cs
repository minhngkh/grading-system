using AssignmentFlow.Application.Assessments;
using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Gradings;

public class GradingAggregate : AggregateRoot<GradingAggregate, GradingId>
{
    private readonly ILogger<GradingAggregate> logger;
    private readonly ISequenceRepository<Grading> sequenceRepository;
    public TeacherId TeacherId => State.TeacherId;
    public readonly GradingWriteModel State;
    public GradingAggregate(
        GradingId id,
        ILogger<GradingAggregate> logger,
        ISequenceRepository<Grading> sequenceRepository)
        : base(id)
    {
        State = new GradingWriteModel();
        this.logger = logger;
        this.sequenceRepository = sequenceRepository;
        Register(State);
    }

    public void CreateGrading(Create.Command command)
    {
        var reference = sequenceRepository.GenerateSequence().GetAwaiter().GetResult();
        Emit(new Create.GradingCreatedEvent
        {
            TeacherId = command.TeacherId,
            Reference = reference
        });

        Emit(new UpdateScaleFactor.ScaleFactorUpdatedEvent
        {
            ScaleFactor = command.ScaleFactor
        });

        ConditionalEmit(command.RubricId is not null,
        () => new ChangeRubric.RubricChangedEvent
        {
            RubricId = command.RubricId!
        });

        ConditionalEmit(command.Name is not null,
        () => new UpdateInfo.InfoUpdatedEvent
        {
            GradingName = command.Name!
        });
    }

    public void UpdateInfo(UpdateInfo.Command command)
    {
        Emit(new UpdateInfo.InfoUpdatedEvent
        {
            GradingName = command.GradingName
        });
    }   

    public void UpdateSelectors(UpdateCriterionSelectors.Command command)
    {
        Emit(new UpdateCriterionSelectors.SelectorsUpdatedEvent
        {
            Selectors = command.Selectors
        });
    }

    public void UpdateScaleFactor(UpdateScaleFactor.Command command)
    {
        Emit(new UpdateScaleFactor.ScaleFactorUpdatedEvent
        {
            ScaleFactor = command.ScaleFactor
        });
    }

    public void ChangeRubric(ChangeRubric.Command command)
    {
        Emit(new ChangeRubric.RubricChangedEvent
        {
            RubricId = command.Rubric
        });
    }

    public void AddSubmissions(List<Submission> submissions)
    {
        UploadSubmission.SubmissionCanBeUploadedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new UploadSubmission.SubmissionAddedEvent(submissions));
    }

    public void RemoveSubmission(RemoveSubmission.Command command)
    {
        Emit(new RemoveSubmission.SubmissionRemovedEvent
        {
            RemovedSubmission = command.SubmissionReference 
        });
    }

    public void StartAutoGrading()
    {
        Start.GradingCanBeStartedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new Start.AutoGradingStartedEvent());
    }

    public void CompleteAutoGrading()
    {
        Start.AutoGradingCanBeFinishedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new Start.AutoGradingFinishedEvent());
    }

    public void RestartAutoGrading()
    {
        //TODO: Add specification to check if grading is in a state that allows re-starting auto-grading
        Emit(new Start.AutoGradingRestartedEvent());
    }

    private void ConditionalEmit(bool condition, Func<AggregateEvent<GradingAggregate, GradingId>> eventPredicate)
    {
        if (condition)
        {
            Emit(eventPredicate());
        }
    }
}

public class GradingId(string id) : Identity<GradingId>(id) { }
