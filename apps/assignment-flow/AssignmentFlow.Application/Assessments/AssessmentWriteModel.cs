using AssignmentFlow.Application.Assessments.StartAutoGrading;
using EventFlow.Aggregates;
namespace AssignmentFlow.Application.Assessments;

public class AssessmentWriteModel
    : AggregateState<AssessmentAggregate, AssessmentId, AssessmentWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;

    public GradingId GradingId { get; private set; } = GradingId.Empty;

    public SubmissionReference Reference { get; private set; } = SubmissionReference.Empty;

    public ScaleFactor ScaleFactor { get; private set; } = ScaleFactor.TenPoint;

    public ScoreBreakdowns ScoreBreakdowns { get; private set; } = ScoreBreakdowns.Empty;

    public List<Feedback> Feedbacks { get; private set; } = [];

    public AssessmentStateMachine StateMachine { get; private set; } = new();

    internal void Apply(Create.AssessmentCreatedEvent @event)
    {
        TeacherId = @event.TeacherId;
        GradingId = @event.GradingId;
        Reference = @event.SubmissionReference;
    }

    internal void Apply(AutoGradingStartedEvent _)
    {
        StateMachine.Fire(AssessmentTrigger.StartAutoGrading);
    }

    internal void Apply(Assess.AssessedEvent @event)
    {
        ScoreBreakdowns = @event.ScoreBreakdowns;
        
        if (@event.Feedbacks != null)
        {
            Feedbacks = @event.Feedbacks;
        }
        
        if (@event.Grader == Grader.AIGrader)
        {
            StateMachine.Fire(AssessmentTrigger.FinishAutoGrading);
        }
    }
}