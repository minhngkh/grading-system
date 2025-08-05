using EventFlow.Aggregates;
using EventFlow.Core;
using RubricEngine.Application.Protos;
using RubricService = RubricEngine.Application.Protos.RubricProtoService.RubricProtoServiceClient;

namespace AssignmentFlow.Application.Gradings;

public class GradingAggregate : AggregateRoot<GradingAggregate, GradingId>
{
    private readonly ILogger<GradingAggregate> logger;
    private readonly RubricService rubricService;
    public TeacherId TeacherId => State.TeacherId;
    public readonly GradingWriteModel State;
    public GradingAggregate(
        GradingId id,
        ILogger<GradingAggregate> logger,
        RubricService rubricService)
        : base(id)
    {
        State = new GradingWriteModel();
        this.logger = logger;
        this.rubricService = rubricService;
        Register(State);
    }

    public void CreateGrading(Create.Command command)
    {
        Emit(new Create.GradingCreatedEvent
        {
            TeacherId = command.TeacherId,
            Reference = command.Reference
        });

        Emit(new UpdateScaleFactor.ScaleFactorUpdatedEvent
        {
            ScaleFactor = command.ScaleFactor
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

    public void ChangeRubric(RubricId rubricId)
    {
        var rubric = rubricService.GetRubric(new GetRubricRequest { RubricId = rubricId });
        var criteria = rubric.Criteria;
        var selectors = criteria.Select(criterion =>
        {
            var criterionName = CriterionName.New(criterion.Name);
            return Selector.New(criterionName, Pattern.All);
        }).ToList();

        Emit(new ChangeRubric.RubricChangedEvent
        {
            RubricId = rubricId
        });

        Emit(new UpdateCriterionSelectors.SelectorsUpdatedEvent
        {
            Selectors = selectors
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
