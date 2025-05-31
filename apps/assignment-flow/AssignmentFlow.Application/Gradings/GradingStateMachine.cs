using Stateless;

namespace AssignmentFlow.Application.Gradings;

public sealed class GradingStateMachine : StateMachine<GradingState, GradingTrigger>
{
    public GradingStateMachine(Func<GradingState> stateAccessor, Action<GradingState> stateMutator) : base(stateAccessor, stateMutator)
    {
        Configure();   
    }

    public GradingStateMachine() : base(GradingState.Created)
    {
        Configure();
    }

    private void Configure()
    {
        Configure(GradingState.Created)
            .PermitReentry(GradingTrigger.UploadSubmission)
            .Permit(GradingTrigger.Start, GradingState.Started);
        
        Configure(GradingState.Started)
            .PermitReentry(GradingTrigger.Start) // Allow restart
            .Permit(GradingTrigger.FinishGrading, GradingState.Graded);

        Configure(GradingState.Graded)
            .Permit(GradingTrigger.Start, GradingState.Started)
            .Permit(GradingTrigger.Complete, GradingState.Completed);
    }
}

public enum GradingTrigger
{
    UploadSubmission = 0,
    Start = 1,
    FinishGrading = 2,
    Complete = 3
}

public enum GradingState
{
    Created = 0,
    Started = 1,
    Graded = 2,
    Completed = 3
}
