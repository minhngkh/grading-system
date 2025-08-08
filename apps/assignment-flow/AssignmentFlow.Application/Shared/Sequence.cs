using JsonApiDotNetCore.Resources.Annotations;
using System.ComponentModel.DataAnnotations;

namespace AssignmentFlow.Application.Shared;

[NoResource]
public class Sequence(string name)
{
    [Key]
    public long CurrentValue { get; set; }
    public string Name { get; set; } = name;
}
