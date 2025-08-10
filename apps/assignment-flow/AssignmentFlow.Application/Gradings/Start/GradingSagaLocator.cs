using EventFlow.Aggregates;
using EventFlow.Sagas;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSagaLocator : ISagaLocator
{
    public Task<ISagaId> LocateSagaAsync(
      IDomainEvent domainEvent,
      CancellationToken cancellationToken)
    {
        return domainEvent.GetAggregateEvent() switch
        {
            AutoGradingStartedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(domainEvent.GetIdentity().Value))),
            Assessments.Create.AssessmentCreatedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
            Assessments.AutoGrading.AutoGradingStartedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
            Assessments.AutoGrading.AutoGradingFinishedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
            Assessments.Assess.AssessedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
            AutoGradingRestartedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(domainEvent.GetIdentity().Value))),
            Assessments.Assess.AssessmentFailedEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
            Assessments.AutoGrading.AutoGradingCancelledEvent @event => Task.FromResult<ISagaId>(new GradingSagaId(GetGradingSagaId(@event.GradingId))),
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
