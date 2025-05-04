using System.Text.Json.Serialization;
using EventFlow.ValueObjects;

namespace Shared.ValueObjects;

/// <summary>
/// Represents an earned or awarded score in an assessment, always non-negative.
/// While Points defines the structure of a rubric, Score represents the actual evaluation result.
/// </summary>
public sealed class Score : SingleValueObject<decimal>
{
    /// <summary>
    /// Represents a score of zero.
    /// </summary>
    public static Score Zero => new(0M);

    [JsonConstructor]
    public Score(decimal value) : base(value) => ArgumentOutOfRangeException.ThrowIfNegative(value);

    public static implicit operator decimal(Score valueObject) => valueObject.Value;

    /// <summary>
    /// Creates a new Score with the specified value.
    /// </summary>
    /// <param name="value">The non-negative score value</param>
    /// <returns>A new Score instance</returns>
    public static Score New(decimal value) => new(value);
}
