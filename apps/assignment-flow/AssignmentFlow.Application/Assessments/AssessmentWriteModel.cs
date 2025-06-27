using EventFlow.Aggregates;
namespace AssignmentFlow.Application.Assessments;

public class AssessmentWriteModel
    : AggregateState<AssessmentAggregate, AssessmentId, AssessmentWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;

    public GradingId GradingId { get; private set; } = GradingId.Empty;

    public RubricId RubricId { get; private set; } = RubricId.Empty;

    public SubmissionReference Reference { get; private set; } = SubmissionReference.Empty;

    public ScaleFactor ScaleFactor { get; private set; } = ScaleFactor.TenPoint;

    public ScoreBreakdowns ScoreBreakdowns { get; private set; } = ScoreBreakdowns.Empty;
    public List<ScoreBreakdownItem> items { get; private set; } = [];
    public List<Feedback> Feedbacks { get; private set; } = [];

    public AssessmentStateMachine StateMachine { get; private set; } = new();

    internal void Apply(Create.AssessmentCreatedEvent @event)
    {
        TeacherId = @event.TeacherId;
        GradingId = @event.GradingId;
        Reference = @event.SubmissionReference;
        RubricId = @event.RubricId;
        ScoreBreakdowns = @event.InitialScoreBreakdowns;
    }

    internal void Apply(AutoGrading.AutoGradingStartedEvent _)
    {
        StateMachine.Fire(AssessmentTrigger.StartAutoGrading);
    }

    //Keep this for backward compatibility
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

    internal void Apply(AutoGrading.CriterionAssessedEvent @event)
    {
        ScoreBreakdowns = ScoreBreakdowns.AddOrUpdate(@event.ScoreBreakdownItem);
    }

    internal void Apply(AutoGrading.AutoGradingFinishedEvent _)
    {
        StateMachine.Fire(AssessmentTrigger.FinishAutoGrading);
    }

    internal void Apply(Assess.AssessmentFailedEvent _)
    {
        StateMachine.Fire(AssessmentTrigger.CancelAutoGrading);
    }

    internal void Apply(UpdateFeedBack.FeedbacksUpdatedEvent @event)
    {
        Feedbacks = @event.Feedbacks;
    }
}
