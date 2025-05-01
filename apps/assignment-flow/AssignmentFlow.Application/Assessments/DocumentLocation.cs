using EventFlow.ValueObjects;
using Newtonsoft.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a location within a document, specifying the exact position range for highlighting or annotating.
/// </summary>
public sealed class DocumentLocation : ValueObject
{
    /// <summary>
    /// Gets the starting line number (0-based).
    /// </summary>
    public int FromLine { get; }

    /// <summary>
    /// Gets the ending line number (0-based).
    /// </summary>
    public int ToLine { get; }

    /// <summary>
    /// Gets the starting column number (0-based).
    /// </summary>
    public int FromColumn { get; }

    /// <summary>
    /// Gets the ending column number (0-based).
    /// </summary>
    public int ToColumn { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="DocumentLocation"/> class.
    /// </summary>
    /// <param name="fromLine">Starting line number (0-based).</param>
    /// <param name="toLine">Ending line number (0-based).</param>
    /// <param name="fromColumn">Starting column number (0-based).</param>
    /// <param name="toColumn">Ending column number (0-based).</param>
    [JsonConstructor]
    public DocumentLocation(int fromLine, int toLine, int fromColumn, int toColumn)
    {
        if (fromLine < 0)
            throw new ArgumentOutOfRangeException(nameof(fromLine), "FromLine must be non-negative");
        
        if (toLine < fromLine)
            throw new ArgumentOutOfRangeException(nameof(toLine), "ToLine must be greater than or equal to FromLine");
        
        if (fromColumn < 0)
            throw new ArgumentOutOfRangeException(nameof(fromColumn), "FromColumn must be non-negative");
        
        if (fromLine == toLine && toColumn < fromColumn)
            throw new ArgumentOutOfRangeException(nameof(toColumn), 
                "ToColumn must be greater than or equal to FromColumn when on the same line");

        FromLine = fromLine;
        ToLine = toLine;
        FromColumn = fromColumn;
        ToColumn = toColumn;
    }

    /// <summary>
    /// Creates a new instance of <see cref="DocumentLocation"/>.
    /// </summary>
    /// <param name="fromLine">Starting line number (0-based).</param>
    /// <param name="toLine">Ending line number (0-based).</param>
    /// <param name="fromColumn">Starting column number (0-based).</param>
    /// <param name="toColumn">Ending column number (0-based).</param>
    /// <returns>A new <see cref="DocumentLocation"/> instance.</returns>
    public static DocumentLocation New(int fromLine, int toLine, int fromColumn, int toColumn) =>
        new(fromLine, toLine, fromColumn, toColumn);
    
    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return FromLine;
        yield return ToLine;
        yield return FromColumn;
        yield return ToColumn;
    }
}
