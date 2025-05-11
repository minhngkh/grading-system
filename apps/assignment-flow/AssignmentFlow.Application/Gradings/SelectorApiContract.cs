using System.ComponentModel.DataAnnotations;
using JsonApiDotNetCore.Resources.Annotations;

namespace AssignmentFlow.Application.Gradings;

[NoResource]
public class SelectorApiContract
{
    [MaxLength(ModelConstants.ShortText)]
    public string Criterion { get; set; } = string.Empty;
    
    [MaxLength(ModelConstants.MediumText)]
    public string Pattern { get; set; } = string.Empty;
}