using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;
using AssignmentFlow.Application.Gradings.UploadSubmission;
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
            TeacherId = command.TeacherId,
            RubricId = command.RubricId,
            ScaleFactor = command.ScaleFactor,
            Selectors = command.Selectors
        });
    }

    public void UpdateSelectors(UpdateCriterionSelectors.Command command)
    {
        Emit(new SelectorsUpdatedEvent
        {
            Selectors = command.Selectors
        });
    }

    public Pattern GetGlobalPattern() => this.State.GlobalPattern;
    public List<Selector> GetCriterionAttachmentsSelectors() => this.State.Selectors;

    public void AddSubmission(Submission submission)
    {
        SubmissionCanBeUploadedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new SubmissionAddedEvent(submission));
    }

    public void StartGrading()
    {
        GradingCanBeStartedSpecification.New().ThrowDomainErrorIfNotSatisfied(State);

        Emit(new GradingStartedEvent());
    }
}

public class GradingId(string id) : Identity<GradingId>(id) { }