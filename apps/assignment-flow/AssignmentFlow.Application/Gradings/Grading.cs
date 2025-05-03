using System.ComponentModel.DataAnnotations;
using AssignmentFlow.Application.Gradings.Create;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;
using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Gradings;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class Grading
    : Identifiable<string>,
    IReadModel,
    IAmReadModelFor<GradingAggregate, GradingId, GradingCreatedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, SubmissionAddedEvent>
{
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public override string Id { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string TeacherId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string RubricId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal ScaleFactor { get; set; } = 10M;

    [Attr(Capabilities = AllowView)]
    public List<CriterionAttachmentsSelectorApiContract> CriterionAttachmentsSelectors { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<SubmissionApiContract> Submissions { get; set; } = [];

    public Task ApplyAsync(
        IReadModelContext context,
        IDomainEvent<GradingAggregate, GradingId, GradingCreatedEvent> domainEvent,
        CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId.Value;
        RubricId = domainEvent.AggregateEvent.RubricId.Value;
        ScaleFactor = domainEvent.AggregateEvent.ScaleFactor;
        CriterionAttachmentsSelectors = domainEvent.AggregateEvent.Selectors
            .ConvertAll(selector => new CriterionAttachmentsSelectorApiContract
            {
                Criterion = selector.Criterion.Value,
                Selector = new ContentSelectorApiContract
                {
                    Pattern = selector.ContentSelector.Pattern,
                    Strategy = selector.ContentSelector.Strategy
                }
            });

        return Task.CompletedTask;
    }

    public Task ApplyAsync(
        IReadModelContext context,
        IDomainEvent<GradingAggregate, GradingId, SubmissionAddedEvent> domainEvent,
        CancellationToken cancellationToken)
    {
        var submission = domainEvent.AggregateEvent.Submission;
        Submissions.Add(new()
        {
            Reference = submission.Reference.Value,
            CriteriaFiles = [.. submission.CriteriaFiles
                .Select(c => new CriterionFilesApiContract
                {
                    Criterion = c.Criterion.Value,
                    Files = c.Files.ConvertAll(x => x.Value)
                })]
        });
        
        return Task.CompletedTask;
    }
}

[NoResource]
public class CriterionAttachmentsSelectorApiContract
{
    public string Criterion { get; init; } = string.Empty;
    public ContentSelectorApiContract Selector { get; init; } = new();
}

[NoResource]
public class ContentSelectorApiContract
{
    public string Pattern { get; init; } = string.Empty;
    public string Strategy { get; init; } = string.Empty;
}
