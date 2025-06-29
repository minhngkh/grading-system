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

        breakdownItem.MarkAsGraded();

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
    ICommandBus commandBus,
    ILogger<CriterionGradingFailedConsumer> logger)
    : IConsumer<ICriterionGradingFailed>
{
    public async Task Consume(ConsumeContext<ICriterionGradingFailed> context)
    {
        logger.LogError("received: {AssessmentId}, CriterionName: {CriterionName}, Error: {Error}",
            context.Message.AssessmentId,
            context.Message.CriterionName,
            context.Message.Error);

        var assessmentId = AssessmentId.With(context.Message.AssessmentId);
        var criterionName = CriterionName.New(context.Message.CriterionName);
        var scoreBreakdownItem = ScoreBreakdownItem.Pending(criterionName);
        scoreBreakdownItem.MarkAsFailed(context.Message.Error);
        scoreBreakdownItem.FailureReason = context.Message.Error;

        await commandBus.PublishAsync(
            new AssessCriterionCommand(assessmentId)
            {
                ScoreBreakdownItem = scoreBreakdownItem,
                Feedbacks = []
            },
            context.CancellationToken);
    }
}
