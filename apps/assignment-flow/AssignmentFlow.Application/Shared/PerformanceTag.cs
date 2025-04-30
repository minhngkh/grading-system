using Newtonsoft.Json;

namespace AssignmentFlow.Application.Shared;

/// <summary>
/// Represents a performance tag associated with a score breakdown item.
/// </summary>
public sealed class PerformanceTag : StringValueObject
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PerformanceTag"/> class with the specified value.
    /// </summary>
    /// <param name="value">The tag value.</param>
    [JsonConstructor]
    public PerformanceTag(string value) : base(value) { }
    
    /// <summary>
    /// Gets the maximum allowed length for a performance tag.
    /// </summary>
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    
    /// <summary>
    /// Creates a new instance of <see cref="PerformanceTag"/> with the specified value.
    /// </summary>
    /// <param name="value">The tag value.</param>
    /// <returns>A new <see cref="PerformanceTag"/> instance.</returns>
    public static PerformanceTag New(string value) => new(value);
}
