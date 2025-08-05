using System.ComponentModel.DataAnnotations;

namespace AssignmentFlow.Application.Gradings.UpdateInfo;

public class UpdateInfoRequest
{
    [MaxLength(ModelConstants.MediumText)]
    public required string Name { get; set; }
}
