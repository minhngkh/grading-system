using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace RubricEngine.Application.Rubrics.Complete;

public class GradingStartedConsumer(
    ICommandBus commandBus,
    ILogger<GradingStartedConsumer> logger) : IConsumer<GradingStarted>
{
    public async Task Consume(ConsumeContext<GradingStarted> context)
    {
        logger.LogInformation("Consuming GradingStarted event with TeacherId: {TeacherId}, GradingId: {GradingId}, RubricId: {RubricId}",
            context.Message.TeacherId, context.Message.GradingId, context.Message.RubricId);

        var rubricId = RubricId.With(context.Message.RubricId);
        await commandBus.PublishAsync(new Command(rubricId)
        {
            GradingId = context.Message.GradingId
        }, context.CancellationToken);

        await Task.CompletedTask;
    }
}
