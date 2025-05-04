using AssignmentFlow.IntegrationEvents;
using MassTransit;

namespace AssignmentFlow.Application.Gradings.Start;

public class FakeSubmissionGradingStartedConsumer(
    ILogger<FakeSubmissionGradingStartedConsumer> logger)
    : IConsumer<ISubmissionGradingStarted>
{
    public Task Consume(ConsumeContext<ISubmissionGradingStarted> context)
    {
        // Simulate some processing
        logger.LogInformation(
            $"Received grading started event for submission: {context.Message.SubmissionReference}");

        return Task.CompletedTask;
    }
}