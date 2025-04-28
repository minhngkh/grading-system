using System.ComponentModel.DataAnnotations;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;
using RubricEngine.Application.Rubrics.Create;
using RubricEngine.Application.Rubrics.Update;
using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace RubricEngine.Application.Rubrics;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class Rubric :
    Identifiable<string>,
    IReadModel,
    IAmReadModelFor<RubricAggregate, RubricId, RubricCreatedEvent>,
    IAmReadModelFor<RubricAggregate, RubricId, RubricInfoUpdatedEvent>,
    IAmReadModelFor<RubricAggregate, RubricId, CriteriaUpdatedEvent>,
    IAmReadModelFor<RubricAggregate, RubricId, PerformanceTagsUpdatedEvent>
{
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public override string Id { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string TeacherId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.MediumLongText)]
    public string RubricName { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<string> PerformanceTags { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<CriterionApiContract> Criteria { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public DateTimeOffset UpdatedOn { get; set; } 

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<RubricAggregate, RubricId, RubricCreatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId;
        RubricName = domainEvent.AggregateEvent.Name;
        UpdatedOn = domainEvent.Timestamp.ToUniversalTime();

        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<RubricAggregate, RubricId, RubricInfoUpdatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        RubricName = domainEvent.AggregateEvent.Name;
        UpdatedOn = domainEvent.Timestamp.ToUniversalTime();

        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<RubricAggregate, RubricId, CriteriaUpdatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        Criteria = domainEvent.AggregateEvent.Criteria.ToApiContract();
        UpdatedOn = domainEvent.Timestamp.ToUniversalTime();

        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<RubricAggregate, RubricId, PerformanceTagsUpdatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        PerformanceTags = [.. domainEvent.AggregateEvent.PerformanceTags.Select(pt => pt.Value)];
        UpdatedOn = domainEvent.Timestamp.ToUniversalTime();

        return Task.CompletedTask;
    }
}
