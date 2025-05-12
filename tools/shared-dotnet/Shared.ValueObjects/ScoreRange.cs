using System.Text.Json.Serialization;
using EventFlow.ValueObjects;

namespace Shared.ValueObjects;

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
