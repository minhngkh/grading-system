using AssignmentFlow.Application.Gradings.Create;
using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingWriteModel : AggregateState<GradingAggregate, GradingId, GradingWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    
    public ScaleFactor ScaleFactor { get; private set; } = ScaleFactor.TenPoint;

    public Pattern GlobalPattern
    {
        get
        {
            var patterns = string.Join(",",
                Selectors.Select(s => s.Pattern.Value));
            return Pattern.New(patterns);
        }
        private set{}
    }
    public List<Selector> Selectors { get; private set; } = [];

    public List<Submission> Submissions { get; private set; } = [];
    
    public GradingStateMachine StateMachine { get; private set; } = new();

    internal void Apply(GradingCreatedEvent @event)
    {
        TeacherId = @event.TeacherId;
        Selectors = @event.Selectors;
    }

    internal void Apply(SelectorsUpdatedEvent @event)
    {
        Selectors = @event.Selectors;
    }

    internal void Apply(SubmissionAddedEvent @event)
    {
        Submissions.Add(@event.Submission);
    }

    internal void Apply(GradingStartedEvent @event)
    {
        StateMachine.Fire(GradingTrigger.Start);
    }
}

