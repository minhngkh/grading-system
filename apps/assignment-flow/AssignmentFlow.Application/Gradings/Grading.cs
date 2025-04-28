using System.ComponentModel.DataAnnotations;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;
using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Gradings;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class Grading
    : Identifiable<string>,
    IReadModel
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

    [Attr(Capabilities = AllowView)]
    public List<CriterionAttachmentsSelectorApiContract> CriterionAttachmentsSelectors { get; set; } = [];
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
