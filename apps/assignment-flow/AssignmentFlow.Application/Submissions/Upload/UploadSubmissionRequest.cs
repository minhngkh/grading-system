using System.ComponentModel.DataAnnotations;
namespace AssignmentFlow.Application.Submissions.Upload;

public class UploadSubmissionRequest
{
    public required string StudentId { get; init; }
    public required string AssignmentId { get; init; }
    public required IFormFile File { get; init; }
}