using AssignmentFlow.Application.Gradings.ChangeRubric;
using AssignmentFlow.Application.Gradings.Create;
using AssignmentFlow.Application.Gradings.RemoveSubmission;
using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;
using AssignmentFlow.Application.Gradings.UpdateInfo;
using AssignmentFlow.Application.Gradings.UpdateScaleFactor;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingWriteModel : AggregateState<GradingAggregate, GradingId, GradingWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public RubricId RubricId { get; private set; } = RubricId.Empty;
    public string Reference { get; private set; } = string.Empty;
    public GradingName Name { get; private set; } = GradingName.Empty;
    public ScaleFactor ScaleFactor { get; private set; } = ScaleFactor.TenPoint;
    public List<Selector> Selectors { get; private set; } = [];
   
    public List<Submission> Submissions { get; private set; } = [];
   
    public GradingStateMachine StateMachine { get; private set; } = new();

    internal void Apply(GradingCreatedEvent @event)
    {
        TeacherId = @event.TeacherId;
        Reference = @event.Reference;
    }

    internal void Apply(InfoUpdatedEvent @event)
    {
        Name = @event.GradingName;
    }

    internal void Apply(SelectorsUpdatedEvent @event)
    {
        Selectors = @event.Selectors;
    }

    internal void Apply(ScaleFactorUpdatedEvent @event)
    {
        ScaleFactor = @event.ScaleFactor;
    }

    internal void Apply(RubricChangedEvent @event)
    {
        RubricId = @event.RubricId;
        Selectors = [];
    }

    internal void Apply(SubmissionAddedEvent @event)
    {
        Submissions.AddRange(@event.Submissions);
    }

    internal void Apply(SubmissionRemovedEvent @event)
    {
        Submissions.RemoveAll(s => s.Reference == @event.RemovedSubmission);
    }

    internal void Apply(AutoGradingStartedEvent @event)
    {
        StateMachine.Fire(GradingTrigger.Start);
    }

    internal void Apply(AutoGradingFinishedEvent @event)
    {
        StateMachine.Fire(GradingTrigger.FinishGrading);
    }

    internal void Apply(AutoGradingRestartedEvent @event)
    {
        StateMachine.Fire(GradingTrigger.Restart);
    }
}

