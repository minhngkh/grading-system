using AssignmentFlow.IntegrationEvents;
using EventFlow.Aggregates;
using EventFlow.Subscribers;
using MassTransit;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingStartedEventSubscriber(
    IPublishEndpoint publishEndpoint)
    : ISubscribeAsynchronousTo<GradingAggregate, GradingId, GradingStartedEvent>
{
    public async Task HandleAsync(IDomainEvent<GradingAggregate, GradingId, GradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        await publishEndpoint.Publish<GradingStarted>(new
        {
            domainEvent.AggregateEvent.TeacherId,
            domainEvent.AggregateEvent.RubricId,
            GradingId = domainEvent.AggregateIdentity.Value
        });
    }
}
