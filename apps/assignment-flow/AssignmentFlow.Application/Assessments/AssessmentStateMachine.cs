using Stateless;
using Stateless.Graph;

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
            .Permit(AssessmentTrigger.CancelAutoGrading, AssessmentState.AutoGradingFailed)
            // If assessment is completely manually graded, we can skip auto-grading
            .Permit(AssessmentTrigger.FinishAutoGrading, AssessmentState.AutoGradingFinished)
            .Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted);

        Configure(AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.FinishAutoGrading, AssessmentState.AutoGradingFinished)
            .Permit(AssessmentTrigger.CancelAutoGrading, AssessmentState.AutoGradingFailed);

        Configure(AssessmentState.AutoGradingFinished)
            .PermitReentry(AssessmentTrigger.FinishAutoGrading)
            //.Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.WaitForManualGrading, AssessmentState.ManualGradingRequired)
            .Permit(AssessmentTrigger.Complete, AssessmentState.Completed);

        Configure(AssessmentState.AutoGradingFailed)
            //.Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.WaitForManualGrading, AssessmentState.ManualGradingRequired);

        Configure(AssessmentState.ManualGradingRequired)
            .Permit(AssessmentTrigger.Complete, AssessmentState.Completed);

        Configure(AssessmentState.Completed)
            .Permit(AssessmentTrigger.StartAutoGrading, AssessmentState.AutoGradingStarted)
            .Permit(AssessmentTrigger.WaitForManualGrading, AssessmentState.ManualGradingRequired);

        string graph = MermaidGraph.Format(this.GetInfo());
    }
}

public enum AssessmentTrigger
{
    StartAutoGrading = 1,
    FinishAutoGrading = 2,
    CancelAutoGrading = 3,
    Complete = 4,
    WaitForManualGrading = 5
}

public enum AssessmentState
{
    Created = 0,
    AutoGradingStarted = 1,
    AutoGradingFinished = 2,
    AutoGradingFailed = 3,
    Completed = 4,
    ManualGradingRequired = 5
}
