namespace AssignmentFlow.Application.Assessments;

public class Grader : StringValueObject
{
    public static Grader Teacher => new("teacher");
    public static Grader AIGrader => new("aiGrader");
    public static Grader Default => Teacher;

    private Grader(string value) : base(value switch
    {
        "teacher" => Teacher,
        "aiGrader" => AIGrader,
        _ => throw new ArgumentException($"Invalid grader type: '{value}'. Allowed values are 'teacher' or 'aiGrader'.", nameof(value))
    }){ }

    public static implicit operator string(Grader valueObject) => valueObject.Value;

    public static Grader New(string value) => new(value);
}