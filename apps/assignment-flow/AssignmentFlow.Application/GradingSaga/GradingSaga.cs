using AssignmentFlow.Application.Gradings;
using AssignmentFlow.Application.Gradings.Start;
using EventFlow.Aggregates;
using EventFlow.Sagas;
using EventFlow.Sagas.AggregateSagas;

namespace AssignmentFlow.Application.GradingSaga;

public class GradingSaga : AggregateSaga<GradingSaga, GradingSagaId, GradingSagaLocator>,
    ISagaIsStartedBy<GradingAggregate, GradingId, GradingStartedEvent>
{
    public ILogger<GradingSaga> logger;

    public GradingSaga(GradingSagaId id, ILogger<GradingSaga> logger) : base(id)
    {
        this.logger = logger;
    }

    public Task HandleAsync(
        IDomainEvent<GradingAggregate, GradingId, GradingStartedEvent> domainEvent,
        ISagaContext sagaContext,
        CancellationToken cancellationToken)
    {
        //TODO: Foreach submission, create an assessment
        logger.LogInformation("GradingSaga starte.");
        return Task.CompletedTask;
    }

    public void Apply()
    {
        Complete();
    }
}
