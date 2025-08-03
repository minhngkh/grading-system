using AssignmentFlow.Application.Assessments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AssignmentFlow.Application.Hub;

[Authorize]
public class GradingsHub(AssignmentFlowDbContext dbContext) : Hub<IGradingClient>
{
    // Step-by-step plan (pseudocode):
    // 1) Extract user ID from connection context.
    // 2) Query the gradings table to match gradingId and user ID.
    // 3) If no match found, throw an unauthorized exception.
    // 4) If valid, proceed to join group and fetch progress.
    // 5) If all statuses are AutoGradingFinished, trigger client notification.

    public async Task<List<AssessmentProgress>> Register(string gradingId)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new HubException("Teacher ID not found.");

        var gradingMatch = await dbContext.Gradings
            .AsNoTracking()
            .Where(g => g.Id == gradingId && g.TeacherId == userId)
            .FirstOrDefaultAsync() ?? throw new HubException("Invalid grading access.");

        await Groups.AddToGroupAsync(Context.ConnectionId, gradingId);

        var progress = await dbContext.Assessments
            .AsNoTracking()
            .Where(a => a.GradingId == gradingId)
            .Select(a => new AssessmentProgress
            {
                SubmissionReference = a.SubmissionReference,
                AssessmentId = a.Id,
                Status = a.Status,
                ErrorMessage = null,
            })
            .ToListAsync();

        if (progress.All(p => p.Status == AssessmentState.Completed.ToString()))
        {
            _ = Clients.Groups(gradingId).Complete();
        }

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
    public string? ErrorMessage { get; init; } // Optional error message if the assessment failed
}

public class AssessmentCriterionProgress
{
    public required string SubmissionReference { get; init; } // e.g., "student_id"
    public required string AssessmentId { get; init; }
    public required ScoreBreakdownApiContract RawScore { get; init; }
}

public interface IGradingClient
{
    Task ReceiveAssessmentCriterionProgress(AssessmentCriterionProgress progress);
    Task ReceiveAssessmentProgress(AssessmentProgress progress);
    Task Complete();
}
