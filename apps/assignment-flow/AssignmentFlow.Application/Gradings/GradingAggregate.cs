using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Gradings;

public class GradingAggregate : AggregateRoot<GradingAggregate, GradingId>
{
    private readonly ILogger<GradingAggregate> logger;
    public TeacherId TeacherId => State.TeacherId;
    public readonly GradingWriteModel State;
    public GradingAggregate(
        GradingId id,
        ILogger<GradingAggregate> logger)
        : base(id)
    {
        State = new GradingWriteModel();
        this.logger = logger;
        Register(State);
    }

    public void CreateGrading(Create.Command command)
    {
        Emit(new Create.GradingCreatedEvent
        {
            TeacherId = command.TeacherId
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

    public void AddSubmission(Submission submission)
    {
        UploadSubmission.SubmissionCanBeUploadedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new UploadSubmission.SubmissionAddedEvent(submission));
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
}

public class GradingId(string id) : Identity<GradingId>(id) { }
