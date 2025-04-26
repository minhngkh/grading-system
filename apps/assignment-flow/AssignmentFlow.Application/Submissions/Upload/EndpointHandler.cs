using EventFlow;
using EventFlow.Queries;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentFlow.Application.Submissions.Upload;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", UploadSubmission)
            .WithName("UploadSubmission")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .DisableAntiforgery(); // Disable for now

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        [FromForm] UploadSubmissionRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var submissionId = SubmissionId.New;
        await commandBus.PublishAsync(
            new Command(submissionId)
            {
                StudentId = request.StudentId,
                AssignmentId = request.AssignmentId,
                File = request.File
            }, cancellationToken);

        return TypedResults.Created<string>("", submissionId.Value);
    }
}
