using Microsoft.AspNetCore.SignalR;

namespace AssignmentFlow.Application.Gradings.Hub;

public class GradingsHub : Hub<IGradingClient>
{
    public async Task Register(string gradingId)
    { 
        await Groups.AddToGroupAsync(Context.ConnectionId, gradingId);
    }

    // Group membership isn't preserved when a connection reconnects. The connection needs to rejoin the group when it's re-established.
    // Hence this method is not needed. Keeping it for reference.
    public async Task UnRegister(string gradingId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gradingId);
    }
}

public class GradingProgress
{
    public required string GradingId { get; init; }

    public List<string> PendingAssessmentIds { get; init; } = [];
    public List<string> UnderAutoGradingAssessmentIds { get; init; } = [];
    public List<string> GradedAssessmentIds { get; init; } = [];
    public List<string> FailedAssessmentIds { get; init; } = [];
}

public class AssessmentProgress
{
    public required string SubmissionReference { get; init; } // e.g., "student_id"
    public required string AssessmentId { get; init; }
    public required string Status { get; init; } // e.g., "Pending", "UnderAutoGrading", "Graded", "Failed"
    public required string? ErrorMessage { get; init; } // Optional error message if the assessment failed
}

public enum AssessmentStatus
{
    Pending,
    UnderAutoGrading,
    Graded,
    Failed
}

public interface IGradingClient
{
    Task ReceiveAssessmentProgress(AssessmentProgress progress);
    Task Complete();
}
