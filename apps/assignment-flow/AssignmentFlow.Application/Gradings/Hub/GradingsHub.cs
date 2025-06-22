using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace AssignmentFlow.Application.Gradings.Hub;

[Authorize]
public class GradingsHub(AssignmentFlowDbContext dbContext) : Hub<IGradingClient>
{
    public async Task<List<AssessmentProgress>> Register(string gradingId)
    { 
        await Groups.AddToGroupAsync(Context.ConnectionId, gradingId);

        // Fetch latest assessment progress for the given gradingId
        var progress = await dbContext.Assessments.AsNoTracking()
            .Where(a => a.GradingId == gradingId)
            .Select(a => new AssessmentProgress
            {
                SubmissionReference = a.SubmissionReference,
                AssessmentId = a.Id,
                Status = a.Status.ToString(),
                ErrorMessage = null,
            })
            .ToListAsync();

        return progress;
    }

    // Group membership isn't preserved when a connection reconnects. The connection needs to rejoin the group when it's re-established.
    // Hence this method is not needed. Keeping it for reference.
    public async Task UnRegister(string gradingId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gradingId);
    }
}

public class AssessmentProgress
{
    public required string SubmissionReference { get; init; } // e.g., "student_id"
    public required string AssessmentId { get; init; }
    public required string Status { get; init; } // e.g., "Pending", "UnderAutoGrading", "Graded", "Failed"
    public required string? ErrorMessage { get; init; } // Optional error message if the assessment failed
}

public interface IGradingClient
{
    Task ReceiveAssessmentProgress(AssessmentProgress progress);
    Task Complete();
}
