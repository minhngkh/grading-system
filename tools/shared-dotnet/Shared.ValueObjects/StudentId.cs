using System.Text.Json.Serialization;

namespace Shared.ValueObjects;

/// <summary>
/// Value object representing a unique student identifier.
/// Used to associate rubric assessments with specific students.
/// </summary>
public sealed class StudentId : StringValueObject
{
    /// <summary>
    /// Represents an empty or unassigned student ID.
    /// </summary>
    public static StudentId Empty => new();
    private StudentId() { }

    [JsonConstructor]
    public StudentId(string value) : base(value) { }

    /// <summary>
    /// Creates a new StudentId with the specified value.
    /// </summary>
    /// <param name="value">The student identifier string</param>
    /// <returns>A new StudentId instance</returns>
    public static StudentId New(string value) => new(value);
}
