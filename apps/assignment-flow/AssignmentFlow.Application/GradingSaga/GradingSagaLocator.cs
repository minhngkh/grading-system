using EventFlow.Aggregates;
using EventFlow.Sagas;

namespace AssignmentFlow.Application.GradingSaga;

public class GradingSagaLocator : ISagaLocator
{
    public Task<ISagaId> LocateSagaAsync(
      IDomainEvent domainEvent,
      CancellationToken cancellationToken)
    {
        var gradingId = domainEvent.Metadata["aggregate_id"];
        var gradingSagaId = new GradingSagaId($"gradingsaga-{gradingId}");

        return Task.FromResult<ISagaId>(gradingSagaId);
    }
}