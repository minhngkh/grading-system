using EventFlow.ValueObjects;
using Newtonsoft.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a location within a document, specifying the exact position range for highlighting or annotating.
/// </summary>
public sealed class DocumentLocation : ValueObject
{
    /// <summary>
    /// Gets the document identifier.
    /// </summary>
    public string DocumentId { get; }

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
    /// <param name="documentId">The document identifier.</param>
    /// <param name="fromLine">Starting line number (0-based).</param>
    /// <param name="toLine">Ending line number (0-based).</param>
    /// <param name="fromColumn">Starting column number (0-based).</param>
    /// <param name="toColumn">Ending column number (0-based).</param>
    [JsonConstructor]
    public DocumentLocation(string documentId, int fromLine, int toLine, int fromColumn, int toColumn)
    {
        if (string.IsNullOrEmpty(documentId))
            throw new ArgumentException("Document ID cannot be null or empty", nameof(documentId));
        
        if (fromLine < 0)
            throw new ArgumentOutOfRangeException(nameof(fromLine), "FromLine must be non-negative");
        
        if (toLine < fromLine)
            throw new ArgumentOutOfRangeException(nameof(toLine), "ToLine must be greater than or equal to FromLine");
        
        if (fromColumn < 0)
            throw new ArgumentOutOfRangeException(nameof(fromColumn), "FromColumn must be non-negative");
        
        if (fromLine == toLine && toColumn < fromColumn)
            throw new ArgumentOutOfRangeException(nameof(toColumn), 
                "ToColumn must be greater than or equal to FromColumn when on the same line");

        DocumentId = documentId;
        FromLine = fromLine;
        ToLine = toLine;
        FromColumn = fromColumn;
        ToColumn = toColumn;
    }

    /// <summary>
    /// Creates a new instance of <see cref="DocumentLocation"/>.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="fromLine">Starting line number (0-based).</param>
    /// <param name="toLine">Ending line number (0-based).</param>
    /// <param name="fromColumn">Starting column number (0-based).</param>
    /// <param name="toColumn">Ending column number (0-based).</param>
    /// <returns>A new <see cref="DocumentLocation"/> instance.</returns>
    public static DocumentLocation New(string documentId, int fromLine, int toLine, int fromColumn, int toColumn) =>
        new(documentId, fromLine, toLine, fromColumn, toColumn);

    /// <summary>
    /// Creates a single line selection in a document.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="line">The line number (0-based).</param>
    /// <param name="fromColumn">Starting column number (0-based).</param>
    /// <param name="toColumn">Ending column number (0-based).</param>
    /// <returns>A new <see cref="DocumentLocation"/> instance.</returns>
    public static DocumentLocation SingleLine(string documentId, int line, int fromColumn, int toColumn) =>
        new(documentId, line, line, fromColumn, toColumn);

    /// <summary>
    /// Creates a whole line selection in a document.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="line">The line number (0-based).</param>
    /// <returns>A new <see cref="DocumentLocation"/> instance.</returns>
    public static DocumentLocation WholeLine(string documentId, int line) =>
        new(documentId, line, line, 0, int.MaxValue);

    /// <summary>
    /// Creates a multi-line selection in a document, selecting entire lines.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="fromLine">Starting line number (0-based).</param>
    /// <param name="toLine">Ending line number (0-based).</param>
    /// <returns>A new <see cref="DocumentLocation"/> instance.</returns>
    public static DocumentLocation WholeLines(string documentId, int fromLine, int toLine) =>
        new(documentId, fromLine, toLine, 0, int.MaxValue);

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return DocumentId;
        yield return FromLine;
        yield return ToLine;
        yield return FromColumn;
        yield return ToColumn;
    }
}
