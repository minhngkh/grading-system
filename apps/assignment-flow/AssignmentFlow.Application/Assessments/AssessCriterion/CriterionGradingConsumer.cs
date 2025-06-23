using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.AssessCriterion;

public class CriterionGradingConsumer(
    ICommandBus commandBus,
    ILogger<CriterionGradingConsumer> logger)
    : IConsumer<ICriterionGraded>, IConsumer<ICriterionGradingFailed>
{
    public async Task Consume(ConsumeContext<ICriterionGraded> context)
    {
        logger.LogInformation("received: {AssessmentId}, CriterionName: {CriterionName}",
            context.Message.AssessmentId,
            context.Message.CriterionName);

        var assessmentId = AssessmentId.With(context.Message.AssessmentId);
        var (breakdownItem, feedbackItems) = context.Message.ScoreBreakdown
            .ToValueObject(context.Message.CriterionName, Grader.AIGrader, context.Message.Metadata);

        var command = new Command(assessmentId)
        {
            ScoreBreakdownItem = breakdownItem,
            Feedbacks = feedbackItems
        };
        
        await commandBus.PublishAsync(command, cancellationToken: context.CancellationToken);
    }

    public Task Consume(ConsumeContext<ICriterionGradingFailed> context)
    {
        logger.LogError("received: {AssessmentId}, CriterionName: {CriterionName}, Error: {Error}",
            context.Message.AssessmentId,
            context.Message.CriterionName,
            context.Message.Error);

        var assessmentId = AssessmentId.With(context.Message.AssessmentId);

        return Task.CompletedTask;
    }
}
