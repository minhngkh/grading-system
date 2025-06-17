using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssignmentFlow.Application.Gradings.Analytics;

public static class EndpointHandler
{
    public static IEndpointRouteBuilder MapGradingAnalytics(this IEndpointRouteBuilder endpoint)
    {
        endpoint.MapGet("/summary", GetGradingsSummary)
            .WithName("GradingsSummary")
            .Produces<OverallGradingAnalytics>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        endpoint.MapGet("/{id}/summary", GetGradingSummary)
            .WithName("GradingSummary")
            .Produces<GradingAnalytics>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return endpoint;
    }

    [Authorize]
    private static async Task<IResult> GetGradingsSummary(
        [FromServices] IGradingAnalyticService gradingAnalyticService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var teacherId = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new ArgumentNullException(nameof(user), "Teacher id must have been provided in the claims.");

        var summary = await gradingAnalyticService.GetOverallGradingAnalyticsAsync(
            teacherId,
            cancellationToken);

        return TypedResults.Ok(summary);
    }

    [Authorize]
    private static async Task<IResult> GetGradingSummary(
        [FromRoute] string id,
        [FromServices] IGradingAnalyticService gradingAnalyticService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var teacherId = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new ArgumentNullException(nameof(user), "Teacher id must have been provided in the claims.");

        var summary = await gradingAnalyticService.GetGradingAnalyticsAsync(
            teacherId,
            id,
            cancellationToken);

        return TypedResults.Ok(summary);
    }
}
