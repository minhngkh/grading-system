using EventFlow.Aggregates;
using RubricEngine.Application.Rubrics.Complete;
using RubricEngine.Application.Rubrics.Create;
using RubricEngine.Application.Rubrics.Update;
namespace RubricEngine.Application.Rubrics;

public class RubricWriteModel
    : AggregateState<RubricAggregate, RubricId, RubricWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public RubricName Name { get; private set; } = RubricName.Empty;
    public List<PerformanceTag> PerformanceTags { get; private set; } = [];
    public List<Criterion> Criteria { get; private set; } = [];

    public string GradingId = string.Empty;

    public string Status { get; private set; } = RubricStatus.Draft.ToString();

    internal void Apply(RubricCreatedEvent @event)
    {
        Name = @event.Name;
        TeacherId = @event.TeacherId;
    }

    internal void Apply(RubricInfoUpdatedEvent @event)
    {
        Name = @event.Name;
    }

    internal void Apply(CriteriaUpdatedEvent @event)
    {
        Criteria = [.. @event.Criteria];
    }

    internal void Apply(PerformanceTagsUpdatedEvent @event)
    {
        PerformanceTags = [.. @event.PerformanceTags];
    }

    internal void Apply(RubricUsedEvent @event)
    {
        GradingId = @event.GradingId;
        Status = RubricStatus.Used.ToString();
    }
}
