using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class CriterionGradingConsumer(
    ICommandBus commandBus,
    ILogger<CriterionGradingConsumer> logger)
    : IConsumer<ICriterionGraded>
{
    public async Task Consume(ConsumeContext<ICriterionGraded> context)
    {
        logger.LogInformation("received: {AssessmentId}, CriterionName: {CriterionName}",
            context.Message.AssessmentId,
            context.Message.CriterionName);

        var assessmentId = AssessmentId.With(context.Message.AssessmentId);
        var (breakdownItem, feedbackItems) = context.Message.ScoreBreakdown
            .ToValueObject(context.Message.CriterionName, Grader.AIGrader, context.Message.Metadata);

        await commandBus.PublishAsync(
            new AssessCriterionCommand(assessmentId)
            {
                ScoreBreakdownItem = breakdownItem,
                Feedbacks = feedbackItems
            },
            cancellationToken: context.CancellationToken);
    }
}

public class CriterionGradingFailedConsumer(
    ILogger<CriterionGradingFailedConsumer> logger)
    : IConsumer<ICriterionGradingFailed>
{
    public Task Consume(ConsumeContext<ICriterionGradingFailed> context)
    {
        logger.LogError("received: {AssessmentId}, CriterionName: {CriterionName}, Error: {Error}",
            context.Message.AssessmentId,
            context.Message.CriterionName,
            context.Message.Error);
        return Task.CompletedTask;
    }
}
