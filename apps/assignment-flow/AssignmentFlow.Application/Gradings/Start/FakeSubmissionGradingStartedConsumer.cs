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
        await publishEndpoint.Publish<ISubmissionGradingResult>(new
        {
            AssessmentId = context.Message.AssessmentId,
            ScoreBreakdowns = context.Message.Criteria.Select(c => new ScoreBreakdown
            {
                CriterionName = c.CriterionName,
                Tag = c.Levels.First().Tag,
                RawScore = 100M,
                FeedbackItems = []
            })
        }, context.CancellationToken);
    }
}