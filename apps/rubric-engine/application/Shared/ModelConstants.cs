namespace RubricEngine.Application.Shared;

/// <summary>
/// Defines standardized text field length constants for use throughout the application.
/// These constants provide consistent string length constraints for model properties,
/// improving maintainability by centralizing length definitions.
/// 
/// Usage example:
/// [StringLength(ModelConstants.MediumText)]
/// public string Description { get; set; }
/// </summary>
public static class ModelConstants
{
    /// <summary>Very short text for codes, abbreviations, etc.</summary>
    public const int TinyText = 10;

    /// <summary>Short text suitable for names, titles, labels</summary>
    public const int ShortText = 50;

    /// <summary>Slightly longer text for extended names or brief descriptions</summary>
    public const int ShortMediumText = 100;

    /// <summary>Medium-length text for standard descriptions</summary>
    public const int MediumText = 150;

    /// <summary>Longer medium text for extended descriptions</summary>
    public const int MediumLongText = 200;

    /// <summary>Long text for paragraphs or detailed descriptions</summary>
    public const int LongText = 250;

    /// <summary>Very long text for multi-paragraph content</summary>
    public const int VeryLongText = 500;
}
