using System.ComponentModel.DataAnnotations;

namespace RubricEngine.Application.Rubrics.Create;

public class CreateRubricRequest(string name)
{
    [MaxLength(ModelConstants.MediumText)]
    public string Name { get; set; } = name;
}