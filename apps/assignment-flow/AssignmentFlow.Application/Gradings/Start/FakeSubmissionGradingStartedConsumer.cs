using AssignmentFlow.IntegrationEvents;
using MassTransit;

namespace AssignmentFlow.Application.Gradings.Start;

public class FakeSubmissionGradingStartedConsumer(
    IPublishEndpoint publishEndpoint,
    ILogger<FakeSubmissionGradingStartedConsumer> logger)
    : IConsumer<ISubmissionGradingStarted>
{
    public async Task Consume(ConsumeContext<ISubmissionGradingStarted> context)
    {
        var submissionRef = context.Message.SubmissionReference;
        var gradingId = context.Message.GradingId;
        var teacherId = context.Message.TeacherId;

        logger.LogInformation(
            "Received grading started event for submission: {SubmissionRef}, GradingId: {GradingId}, TeacherId: {TeacherId}",
            submissionRef, gradingId, teacherId);

        logger.LogDebug(
            "Processing {CriteriaCount} criteria for submission {SubmissionRef}",
            context.Message.Criteria.Length, submissionRef);

        var result = new
        {
            SubmissionReference = submissionRef,
            GradingId = gradingId,
            TeacherId = teacherId,
            ScoreBreakdowns = context.Message.Criteria.Select(c => new ScoreBreakdown
            {
                CriterionName = c.CriterionName,
                Tag = c.Levels.First().Tag,
                RawScore = 100M,
                FeedbackItems = []
            })
        };

        await publishEndpoint.Publish<ISubmissionGradingResult>(result, context.CancellationToken);

        logger.LogInformation(
            "Published grading result for submission {SubmissionRef}",
            submissionRef);
    }
}