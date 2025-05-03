using AssignmentFlow.Application.Gradings.Create;
using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings;

public class GradingWriteModel : AggregateState<GradingAggregate, GradingId, GradingWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    
    public ScaleFactor ScaleFactor { get; private set; } = ScaleFactor.TenPoint;

    public List<Selector> Selectors { get; private set; } = [];

    public List<Submission> Submissions { get; private set; } = [];

    public bool IsGradingStarted { get; private set; } = false;
    public bool HasGradingFinished { get; private set; } = false;

    internal void Apply(GradingCreatedEvent @event)
    {
        TeacherId = @event.TeacherId;
        Selectors = @event.Selectors;
    }

    internal void Apply(SubmissionAddedEvent @event)
    {
        Submissions.Add(@event.Submission);
    }

    internal void Apply(GradingStartedEvent @event)
    {
        IsGradingStarted = true;
    }
}

