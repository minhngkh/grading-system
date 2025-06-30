using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Assessments;

public class AssessmentAggregate : AggregateRoot<AssessmentAggregate, AssessmentId>
{
    private readonly ILogger<AssessmentAggregate> logger;

    public TeacherId TeacherId => State.TeacherId;

    internal readonly AssessmentWriteModel State;

    public AssessmentAggregate(
        AssessmentId id,
        ILogger<AssessmentAggregate> logger)
        : base(id)
    {
        State = new AssessmentWriteModel();
        this.logger = logger;

        Register(State);
    }

    public void CreateAssessment(Create.Command command)
    {
        var initialScoreBreakdowns = ScoreBreakdowns.New(
            [.. command.Criteria.Select(c => {
                if (c.Plugin == "None") 
                {
                    return ScoreBreakdownItem.Mannual(c.Name);
                }
                return ScoreBreakdownItem.Pending(c.Name);
            })]);

        Emit(new Create.AssessmentCreatedEvent
        {
            SubmissionReference = command.SubmissionReference,
            GradingId = command.GradingId,
            TeacherId = command.TeacherId,
            RubricId = command.RubricId,
            InitialScoreBreakdowns = initialScoreBreakdowns,
            Criteria = command.Criteria
        });
    }

    public void Assess(Assess.Command command)
    {
        var scoreBreakdownsClone = command.ScoreBreakdowns.Clone();
        if (command.Errors != null && command.Errors.Count != 0)
        {
            Emit(new Assess.AssessmentFailedEvent
            {
                GradingId = State.GradingId,
                Errors = command.Errors
            });
            return;
        }

        Emit(new Assess.AssessedEvent
        {
            Grader = command.Grader,
            ScoreBreakdowns = command.Grader.IsAIGrader 
                ? scoreBreakdownsClone.NormalizedScores(State.Criteria)
                : scoreBreakdownsClone,
            Feedbacks = command.Feedbacks,
            GradingId = State.GradingId,
        });
    }

    public void StartAutoGrading()
    {
        Emit(new AutoGrading.AutoGradingStartedEvent
        {
            GradingId = State.GradingId
        });
    }

    public void Assess(AutoGrading.AssessCriterionCommand command)
    {
        ConditionalEmit(
            command.Feedbacks.Count > 0,
            () => new UpdateFeedBack.FeedbacksUpdatedEvent { Feedbacks = command.Feedbacks });

        var scoreItem = command.ScoreBreakdownItem;
        var isAIGrader = scoreItem.Grader.IsAIGrader;
        Emit(new AutoGrading.CriterionAssessedEvent {
            ScoreBreakdownItem = isAIGrader
            ? scoreItem.NormalizedScore(State.Criteria)
            : scoreItem.Clone(),
        });
    }

    public void FinishAutoGrading()
    {
        ConditionalEmit(
            AutoGrading.AutoGradingCanBeFinishedSpecification.New().IsSatisfiedBy(State),
            () => new AutoGrading.AutoGradingFinishedEvent { 
                GradingId = State.GradingId,
                Errors = State.ScoreBreakdowns
                    .Where(item => !string.IsNullOrWhiteSpace(item.FailureReason)).ToDictionary(
                    item => item.CriterionName.Value,
                    item => item.FailureReason)
            });
    }

    public void UpdateFeedbacks(UpdateFeedBack.Command command)
    {
        Emit(new UpdateFeedBack.FeedbacksUpdatedEvent
        {
            Feedbacks = command.Feedbacks
        });
    }

    private void ConditionalEmit(bool condition, Func<AggregateEvent<AssessmentAggregate, AssessmentId>> eventPredicate)
    {
        if (condition)
        {
            Emit(eventPredicate());
        }
    }
}

public class AssessmentId(string id) : Identity<AssessmentId>(id) { }
