using System.ComponentModel.DataAnnotations;

namespace AssignmentFlow.Application.Gradings.ChangeRubric;

public class ChangeRubricRequest
{
    [MaxLength(ModelConstants.ShortText)]
    public required string RubricId { get; set; }
}