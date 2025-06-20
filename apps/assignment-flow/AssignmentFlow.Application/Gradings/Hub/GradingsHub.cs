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

public interface IGradingClient
{
    Task ReceiveGradingProgress(GradingProgress progress);
}
