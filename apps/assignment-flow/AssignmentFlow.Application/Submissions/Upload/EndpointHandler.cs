using EventFlow;
using EventFlow.Queries;

namespace AssignmentFlow.Application.Submissions.Upload;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapUploadSubmission(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapPost("/", UploadSubmission)
            .WithName("UploadSubmission")
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    private static async Task<IResult> UploadSubmission(
        UploadSubmissionRequest request,
        ICommandBus commandBus,
        IQueryProcessor queryProcessor,
        IHttpContextAccessor contextAccessor,
        CancellationToken cancellationToken)
    {
        var submissionId = SubmissionId.New;
        await commandBus.PublishAsync(new Command(submissionId), cancellationToken);

        return TypedResults.Created<string>("", submissionId.Value);
    }
}
