using EventFlow.ValueObjects;
using Newtonsoft.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents metadata for a document highlight or annotation.
/// </summary>
public sealed class HighlightMetadata : ValueObject
{
    /// <summary>
    /// Gets an empty metadata instance.
    /// </summary>
    public static readonly HighlightMetadata Empty = new();

    /// <summary>
    /// Gets the color of the highlight.
    /// </summary>
    public string Color { get; }

    /// <summary>
    /// Gets the opacity of the highlight (0.0-1.0).
    /// </summary>
    public float Opacity { get; }

    /// <summary>
    /// Gets the style of the highlight (e.g., "solid", "dashed", "underline").
    /// </summary>
    public string Style { get; }

    /// <summary>
    /// Gets additional custom properties for the highlight.
    /// </summary>
    public Dictionary<string, object> CustomProperties { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="HighlightMetadata"/> class.
    /// </summary>
    /// <param name="color">The color of the highlight.</param>
    /// <param name="opacity">The opacity of the highlight (0.0-1.0).</param>
    /// <param name="style">The style of the highlight.</param>
    /// <param name="customProperties">Additional custom properties.</param>
    [JsonConstructor]
    public HighlightMetadata(
        string color = "#FFFF00", 
        float opacity = 0.5f, 
        string style = "solid", 
        Dictionary<string, object>? customProperties = null)
    {
        Color = color;
        Opacity = opacity < 0 ? 0 : opacity > 1 ? 1 : opacity;
        Style = style ?? "solid";
        CustomProperties = customProperties ?? new Dictionary<string, object>();
    }

    /// <summary>
    /// Creates a new instance of <see cref="HighlightMetadata"/>.
    /// </summary>
    /// <param name="color">The color of the highlight.</param>
    /// <param name="opacity">The opacity of the highlight (0.0-1.0).</param>
    /// <param name="style">The style of the highlight.</param>
    /// <param name="customProperties">Additional custom properties.</param>
    /// <returns>A new <see cref="HighlightMetadata"/> instance.</returns>
    public static HighlightMetadata New(
        string color = "#FFFF00",
        float opacity = 0.5f,
        string style = "solid",
        Dictionary<string, object>? customProperties = null) =>
        new(color, opacity, style, customProperties);

    /// <summary>
    /// Creates a metadata instance for text highlighting.
    /// </summary>
    /// <param name="color">The color of the highlight.</param>
    /// <param name="opacity">The opacity of the highlight (0.0-1.0).</param>
    /// <returns>A new <see cref="HighlightMetadata"/> instance.</returns>
    public static HighlightMetadata TextHighlight(string color, float opacity = 0.5f) =>
        new(color, opacity, "solid");

    /// <summary>
    /// Creates a metadata instance for error highlighting.
    /// </summary>
    /// <returns>A new <see cref="HighlightMetadata"/> instance with error styling.</returns>
    public static HighlightMetadata Error() =>
        new("#FF0000", 0.3f, "wavy");

    /// <summary>
    /// Creates a metadata instance for warning highlighting.
    /// </summary>
    /// <returns>A new <see cref="HighlightMetadata"/> instance with warning styling.</returns>
    public static HighlightMetadata Warning() =>
        new("#FFA500", 0.3f, "dashed");

    /// <summary>
    /// Provides the components used for equality comparison.
    /// </summary>
    /// <returns>An enumerable of equality components.</returns>
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Color;
        yield return Opacity;
        yield return Style;
        
        foreach (var property in CustomProperties)
        {
            yield return property.Key;
            yield return property.Value?.ToString() ?? string.Empty;
        }
    }

    /// <summary>
    /// Adds or updates a custom property.
    /// </summary>
    /// <param name="key">The property key.</param>
    /// <param name="value">The property value.</param>
    /// <returns>A new instance with the updated property.</returns>
    public HighlightMetadata WithProperty(string key, object value)
    {
        var newProperties = new Dictionary<string, object>(CustomProperties)
        {
            [key] = value
        };
        
        return new HighlightMetadata(Color, Opacity, Style, newProperties);
    }
}
