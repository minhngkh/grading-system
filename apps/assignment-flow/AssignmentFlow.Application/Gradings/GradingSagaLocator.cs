using AssignmentFlow.Application.Assessments.Create;
using AssignmentFlow.Application.Gradings.Start;
using EventFlow.Aggregates;
using EventFlow.Sagas;

namespace AssignmentFlow.Application.Gradings;

public class GradingSagaLocator : ISagaLocator
{
    public Task<ISagaId> LocateSagaAsync(
      IDomainEvent domainEvent,
      CancellationToken cancellationToken)
    {
        return domainEvent.GetAggregateEvent() switch
        {
            GradingStartedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(domainEvent.GetIdentity().Value))),
            AssessmentCreatedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
            _ => throw new ArgumentNullException(nameof(domainEvent))
        };
    }

    private static string GetGradingSagaId(string? gradingId)
    {
        ArgumentException.ThrowIfNullOrEmpty(gradingId);

        return gradingId.StartsWith("grading", StringComparison.Ordinal)
            ? gradingId.Replace("grading", "gradingsaga", StringComparison.Ordinal)
            : $"gradingsaga-{gradingId}";
    }
}