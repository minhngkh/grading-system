using AssignmentFlow.IntegrationEvents;
using EventFlow;
using EventFlow.Queries;
using MassTransit;

namespace RubricEngine.Application.Rubrics.Complete;

public class GradingStartedConsumer(
    ICommandBus commandBus,
    IQueryProcessor queryProcessor,
    ILogger<GradingStartedConsumer> logger)
    : IConsumer<GradingStarted>
{
    public async Task Consume(ConsumeContext<GradingStarted> context)
    {
        logger.LogInformation("Processing GradingStarted event. GradingId: {GradingId}, OriginalRubricId: {OriginalRubricId}, TeacherId: {TeacherId}.",
            context.Message.GradingId, context.Message.RubricId, context.Message.TeacherId);

        var originalRubricId = RubricId.With(context.Message.RubricId);

        // Fetch the original rubric's data
        var originalRubricData = await queryProcessor.ProcessAsync(
            new ReadModelByIdQuery<Rubric>(originalRubricId),
            context.CancellationToken);

        if (originalRubricData == null)
        {
            logger.LogError("Original rubric {OriginalRubricId} not found. Cloning process aborted for GradingId: {GradingId}.",
                originalRubricId, context.Message.GradingId);
            return;
        }

        // Generate a new ID for the cloned rubric
        var clonedRubricId = RubricId.New;
        logger.LogInformation("Initiating rubric clone. OriginalRubricId: {OriginalRubricId} -> ClonedRubricId: {ClonedRubricId}. GradingId: {GradingId}.",
            originalRubricId, clonedRubricId, context.Message.GradingId);

        // 1. Create the new rubric (clone)
        var createCommand = new Create.Command(
            clonedRubricId,
            RubricName.New(originalRubricData.RubricName),
            TeacherId.With(originalRubricData.TeacherId)
        );
        await commandBus.PublishAsync(createCommand, context.CancellationToken);

        // 2. Update the cloned rubric with detailed properties (if any not covered by Create)
        
        var updateCommand = new Update.Command(clonedRubricId)
        {
            PerformanceTags = originalRubricData.PerformanceTags.ToPerformanceTags(),
            Criteria = originalRubricData.Criteria.ToCriteria()
        };
        await commandBus.PublishAsync(updateCommand, context.CancellationToken);

        // 3. Mark the *original* rubric as "Used" for this grading session
        var completeCommand = new Complete.Command(originalRubricId)
        {
            GradingId = context.Message.GradingId
        };
        await commandBus.PublishAsync(completeCommand, context.CancellationToken);

        logger.LogInformation("Successfully cloned rubric {OriginalRubricId} to {ClonedRubricId}. Original rubric {OriginalRubricId} marked as used. GradingId: {GradingId}.",
            originalRubricId, clonedRubricId, originalRubricId, context.Message.GradingId);

        await Task.CompletedTask;
    }
}
