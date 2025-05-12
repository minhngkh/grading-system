using System.Text.Json.Serialization;

namespace Shared.ValueObjects;

/// <summary>
/// Value object representing a unique teacher/instructor identifier.
/// Used to associate rubrics and assessments with specific educators.
/// </summary>
public sealed class TeacherId : StringValueObject
{
    /// <summary>
    /// Represents an empty or unassigned teacher ID.
    /// </summary>
    public static TeacherId Empty => new();
    private TeacherId() { }

    [JsonConstructor]
    public TeacherId(string value) : base(value) { }

    /// <summary>
    /// Creates a new TeacherId with the specified value.
    /// </summary>
    /// <param name="value">The teacher identifier string</param>
    /// <returns>A new TeacherId instance</returns>
    public static TeacherId With(string value) => new(value);
}
