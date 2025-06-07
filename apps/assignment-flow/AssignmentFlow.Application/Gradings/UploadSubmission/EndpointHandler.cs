using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Gradings.UploadSubmission;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/{id:required}/submissions", UploadSubmission)
            .WithName("UploadSubmission")
            .Produces<string>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        [FromRoute] string id,
        [FromForm] IFormFile file,
        ICommandBus commandBus,
        GradingRepository gradingRepository,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var gradingId = GradingId.With(id);
        var studentId = ExtractStudentId(file.FileName);
        var reference = SubmissionReference.New(studentId);

        await commandBus.PublishAsync(
            new Command(gradingId)
            {
                SubmissionReference = reference,
                File = file,
            }, cancellationToken);

        return TypedResults.Created(reference);
    }

    /// <summary>
    /// Extracts the student ID from a filename.
    /// </summary>
    /// <param name="fileName">The filename in format "student_id.*" where everything before the first period is the student ID.</param>
    /// <returns>The extracted student ID, or the entire filename if no extension is present.</returns>
    private static string ExtractStudentId(string fileName)
    {
        // If filename contains a period, extract everything before it
        // This handles cases like "student_id.zip" or "student_id.pdf"
        var dotIndex = fileName.LastIndexOf('.');
        if (dotIndex > 0)
        {
            return fileName[..dotIndex];
        }

        // If no extension, use the whole filename
        return fileName;
    }
}
