using System.Text.Json.Serialization;
using EventFlow.ValueObjects;

namespace Shared.ValueObjects;

/// <summary>
/// Represents a percentage value as a decimal, used for relative weightings and calculations.
/// Typically represents portions of a whole where 100 is the complete amount.
/// </summary>
public sealed class Percentage : SingleValueObject<decimal>
{
    /// <summary>
    /// Represents a percentage of 0 (0%).
    /// </summary>
    public static Percentage Zero => new(0M);

    /// <summary>
    /// Represents a percentage of 100 (100%).
    /// </summary>
    public static Percentage OneHundred => new(100M);

    [JsonConstructor]
    public Percentage(decimal value) : base(value) => Validate(value);

    private void Validate(decimal value)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(value, nameof(value));

        if (value > 100m)
            throw new ArgumentOutOfRangeException(nameof(value), "Percentage value cannot exceed 100%");
    }

    public static implicit operator decimal(Percentage valueObject) => valueObject.Value;

    /// <summary>
    /// Creates a new Percentage with the specified value.
    /// </summary>
    /// <param name="value">The percentage value (e.g., 25 for 25%)</param>
    /// <returns>A new Percentage instance</returns>
    public static Percentage New(decimal value) => new(value);
}
