using Stateless;

namespace AssignmentFlow.Application.Assessments;

public sealed class AssessmentStateMachine : StateMachine<AssessmentState, AssessmentTrigger>
{
    public AssessmentStateMachine(Func<AssessmentState> stateAccessor, Action<AssessmentState> stateMutator) : base(stateAccessor, stateMutator)
    {
        Configure();   
    }

    public AssessmentStateMachine() : base(AssessmentState.Created)
    {
        Configure();
    }

    private void Configure()
    {
        Configure(AssessmentState.Created)
            .Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted);

        
        Configure(AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.FinishAutoGrading, AssessmentState.AutoGradingFinished)
            .Permit(AssessmentTrigger.CancelAutoGrading, AssessmentState.AutoGradingFailed);

        Configure(AssessmentState.AutoGradingFinished)
            .Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.Complete, AssessmentState.Completed);

        Configure(AssessmentState.AutoGradingFailed)
            .Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.Complete, AssessmentState.Completed);
    }
}

public enum AssessmentTrigger
{
    StartAutoGrading = 1,
    FinishAutoGrading = 2,
    CancelAutoGrading = 3,
    Complete = 4
}

public enum AssessmentState
{
    Created = 0,
    AutoGradingStarted = 1,
    AutoGradingFinished = 2,
    AutoGradingFailed = 3,
    Completed = 4
}
