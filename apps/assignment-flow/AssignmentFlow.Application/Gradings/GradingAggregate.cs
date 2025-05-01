using AssignmentFlow.Application.Gradings.Start;
using EventFlow.Aggregates;
using EventFlow.Core;
using EventFlow.Exceptions;

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
            Selectors = command.CriterionAttachmentsSelectors
        });
    }

    public List<CriterionAttachmentsSelector> GetCriterionAttachmentsSelectors() => this.State.CriteriaFilesMappings;

    public void AddSubmission(Submission submission)
    {
        if(this.State.IsGradingStarted)
            throw DomainError.With("Cannot add submission after grading has started");

        Emit(new UploadSubmission.SubmissionAddedEvent(submission));
    }

    public void StartGrading()
    {
        if (!this.State.HasGradingFinished)
            throw DomainError.With("Grading has already started");

        // TODO: Add Specification to check if we can start grading
        Emit(new GradingStartedEvent());
    }
}

public class GradingId(string id) : Identity<GradingId>(id) { }