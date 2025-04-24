using System.ComponentModel.DataAnnotations;
using RubricEngine.Application.Shared;

namespace RubricEngine.Application.Rubrics.Create;

public class CreateRubricRequest(string name)
{
    [MaxLength(ModelConstants.MediumText)]
    public string Name { get; set; } = name;
}