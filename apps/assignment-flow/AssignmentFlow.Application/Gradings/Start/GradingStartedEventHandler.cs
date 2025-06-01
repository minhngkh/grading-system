using AssignmentFlow.IntegrationEvents;
using EventFlow.Aggregates;
using EventFlow.Subscribers;
using MassTransit;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingStartedEventHandler(
    IPublishEndpoint publishEndpoint,
    GradingRepository repository)
    : ISubscribeAsynchronousTo<GradingAggregate, GradingId, GradingStartedEvent>
{
    public async Task HandleAsync(IDomainEvent<GradingAggregate, GradingId, GradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var gradingSummary = await repository.GetGradingSummary(domainEvent.AggregateIdentity.Value, cancellationToken)
            ?? throw new InvalidOperationException($"Grading summary not found for GradingId: {domainEvent.AggregateIdentity.Value}");
        
        await publishEndpoint.Publish(new GradingStarted
        {
            GradingId = gradingSummary.Id,
            RubricId = gradingSummary.RubricId,
            TeacherId = gradingSummary.TeacherId
        }, cancellationToken);
    }
}
