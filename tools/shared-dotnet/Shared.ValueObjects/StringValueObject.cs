using EventFlow.ValueObjects;

namespace Shared.ValueObjects;

/// <summary>
/// Base class for string-based value objects with validation for length constraints.
/// </summary>
public abstract class StringValueObject : SingleValueObject<string>
{
    protected StringValueObject() : base(string.Empty) { }
    protected StringValueObject(string value) : base(value) => Validate(value);

    /// <summary>
    /// Determines if an empty string is accepted as a valid value.
    /// </summary>
    protected virtual bool AllowEmpty => false;

    /// <summary>
    /// Minimum length requirement for the string value, if any.
    /// </summary>
    protected virtual int? MinLength => 1;

    /// <summary>
    /// Maximum length constraint for the string value, if any.
    /// </summary>
    protected virtual int? MaxLength => ModelConstants.ShortText;

    public static implicit operator string(StringValueObject valueObject) => valueObject.Value;

    private void Validate(string value)
    {
        if (AllowEmpty && string.IsNullOrEmpty(value)) return;

        if (!AllowEmpty && string.IsNullOrEmpty(value))
        {
            throw new ArgumentException("Value cannot be empty!", nameof(value));
        }

        if (MinLength.HasValue && value.Length < MinLength.Value)
        {
            throw new ArgumentOutOfRangeException(nameof(value), $"Value must be at least {MinLength.Value} characters long.");
        }

        if (MaxLength.HasValue && value.Length > MaxLength.Value)
        {
            throw new ArgumentOutOfRangeException(nameof(value), $"Value must be at most {MaxLength.Value} characters long.");
        }
    }
}
