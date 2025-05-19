using EventFlow.ValueObjects;
using Newtonsoft.Json;

namespace Shared.ValueObjects;

public class ScaleFactor : SingleValueObject<decimal>
{
    /// <summary>
    /// Scale for GPA grading systems (0–4).
    /// </summary>
    public static ScaleFactor GpaFourPoint => new(4M);

    /// <summary>
    /// Scale for European grading systems (0–20).
    /// </summary>
    public static ScaleFactor EuropeanTwentyPoint => new(20M);

    /// <summary>
    /// Scale for percent-based grading (0–100).
    /// </summary>
    public static ScaleFactor Percent => new(100M);

    /// <summary>
    /// Scale for five-star systems (0–5).
    /// </summary>
    public static ScaleFactor FiveStar => new(5M);

    /// <summary>
    /// Scale for ten-point systems (0–10).
    /// </summary>
    public static ScaleFactor TenPoint => new(10M);

    [JsonConstructor]
    public ScaleFactor(decimal value) : base(value) => Validate(value);

    private void Validate(decimal value)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(value, nameof(value));
    }

    public static implicit operator decimal(ScaleFactor valueObject) => valueObject.Value;

    /// <summary>
    /// Creates a new instance of <see cref="ScaleFactor"/> with the specified value.
    /// </summary>
    /// <param name="value">The scale factor value.</param>
    /// <returns>A new <see cref="ScaleFactor"/> instance.</returns>
    public static ScaleFactor New(decimal value) => new(value);
}
