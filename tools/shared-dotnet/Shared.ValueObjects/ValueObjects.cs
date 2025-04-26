using System.Text.Json.Serialization;
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

/// <summary>
/// Represents a non-negative point value used in rubric criteria and scoring.
/// Points define the raw numerical structure of a rubric before assessment.
/// </summary>
public sealed class Points : SingleValueObject<decimal>
{
    /// <summary>
    /// Represents zero points.
    /// </summary>
    public static Points Zero => new(0M);

    /// <summary>
    /// Represents ten points, commonly used as a base scale in grading.
    /// </summary>
    public static Points Ten => new(10M);

    /// <summary>
    /// Represents one hundred points, commonly used as a percentage scale.
    /// </summary>
    public static Points OneHundred => new(100M);

    [JsonConstructor]
    public Points(decimal value) : base(value) => ArgumentOutOfRangeException.ThrowIfNegative(value);

    public static implicit operator decimal(Points valueObject) => valueObject.Value;

    /// <summary>
    /// Creates a new Points value with the specified amount.
    /// </summary>
    /// <param name="value">The non-negative point value</param>
    /// <returns>A new Points instance</returns>
    public static Points New(decimal value) => new(value);
}

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

/// <summary>
/// Defines a range of valid scores with minimum and maximum boundaries.
/// Used for grading scales, performance level thresholds, and score normalization.
/// </summary>
public sealed class ScoreRange : ValueObject
{
    /// <summary>
    /// The lower boundary of this score range (inclusive).
    /// </summary>
    public Score MinScore { get; }

    /// <summary>
    /// The upper boundary of this score range (inclusive).
    /// </summary>
    public Score MaxScore { get; }


    public ScoreRange(Score minScore, Score maxScore)
    {
        if (minScore > maxScore)
            throw new ArgumentException("Minimum score cannot be greater than maximum score", nameof(minScore));

        MinScore = minScore;
        MaxScore = maxScore;
    }

    /// <summary>
    /// Creates a ScoreRange from decimal values instead of Score objects.
    /// </summary>
    /// <param name="minScore">The minimum score value</param>
    /// <param name="maxScore">The maximum score value</param>
    [JsonConstructor]
    public ScoreRange(decimal minScore, decimal maxScore)
        : this(new Score(minScore), new Score(maxScore))
    {
    }

    /// <summary>
    /// Factory method to create a new ScoreRange.
    /// </summary>
    /// <param name="minScore">The minimum score</param>
    /// <param name="maxScore">The maximum score</param>
    /// <returns>A new ScoreRange instance</returns>
    public static ScoreRange New(Score minScore, Score maxScore) => new(minScore, maxScore);

    /// <summary>
    /// Standard 0-100 scale commonly used for percentage-based grading.
    /// </summary>
    public static ScoreRange ZeroToHundred => new(0M, 100M);

    /// <summary>
    /// Standard 0-10 scale used in some grading systems.
    /// </summary>
    public static ScoreRange ZeroToTen => new(0M, 10M);

    /// <summary>
    /// Standard 0-5 scale used in some rating systems.
    /// </summary>
    public static ScoreRange ZeroToFive => new(0M, 5M);

    /// <summary>
    /// Standard 0-4 scale commonly used for GPA calculation (A=4, B=3, C=2, D=1, F=0).
    /// </summary>
    public static ScoreRange LetterGrade => new(0M, 4M);

    /// <summary>
    /// Determines if a score falls within this range (inclusive).
    /// </summary>
    /// <param name="score">The score to check</param>
    /// <returns>True if the score is within range, false otherwise</returns>
    public bool Contains(Score score) => score >= MinScore && score <= MaxScore;

    /// <summary>
    /// Determines if a decimal value falls within this range (inclusive).
    /// </summary>
    /// <param name="score">The score value to check</param>
    /// <returns>True if the score is within range, false otherwise</returns>
    public bool Contains(decimal score) => score >= MinScore && score <= MaxScore;

    /// <summary>
    /// Calculates what percentage of the range a score represents.
    /// </summary>
    /// <param name="score">The score to convert to a percentage</param>
    /// <returns>A percentage representing the score's position in the range</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if score is outside the range</exception>
    public Percentage CalculatePercentage(Score score)
    {
        if (!Contains(score))
            throw new ArgumentOutOfRangeException(nameof(score), "Score is outside the valid range");

        if (MinScore == MaxScore)
            return Percentage.OneHundred;

        var percentage = (score - MinScore) / (MaxScore - MinScore) * 100M;
        return new Percentage(percentage);
    }

    /// <summary>
    /// Normalizes a score from this range to an equivalent position in another range.
    /// </summary>
    /// <param name="score">The score to normalize</param>
    /// <param name="targetRange">The target range to normalize to</param>
    /// <returns>The equivalent score in the target range</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if score is outside this range</exception>
    public Score NormalizeToRange(Score score, ScoreRange targetRange)
    {
        if (!Contains(score))
            throw new ArgumentOutOfRangeException(nameof(score), "Score is outside the valid range");

        if (MinScore == MaxScore)
            return targetRange.MaxScore;

        var normalizedValue = (score - MinScore) / (MaxScore - MinScore) *
                             (targetRange.MaxScore - targetRange.MinScore) +
                             targetRange.MinScore;

        return new Score(normalizedValue);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return MinScore;
        yield return MaxScore;
    }

    public override string ToString() => $"[{MinScore} - {MaxScore}]";
}

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
    public static TeacherId New(string value) => new(value);
}

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

