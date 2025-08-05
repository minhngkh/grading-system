using System.Text.Json.Serialization;

namespace RubricEngine.Application.Rubrics;

/// <summary>
/// Represents a named rubric that defines assessment criteria for assignments.
/// </summary>
public sealed class RubricName : StringValueObject
{
    public static RubricName Empty => new("Untitled");
    private RubricName() { }
    [JsonConstructor]
    public RubricName(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static RubricName New(string value) => new(value);
}

public sealed class PerformanceTag : StringValueObject
{
    [JsonConstructor]
    public PerformanceTag(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static PerformanceTag New(string value) => new(value);
}

public sealed class CriterionName : StringValueObject
{
    [JsonConstructor]
    public CriterionName(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    public static CriterionName New(string value) => new(value);
}

public sealed class Plugin : StringValueObject
{
    public static Plugin None => new(string.Empty);
    [JsonConstructor]
    public Plugin(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    protected override bool AllowEmpty => true;
    public static Plugin New(string value) => new(value);
}

public sealed class Configuration : StringValueObject
{
    public static Configuration None => new(string.Empty);
    [JsonConstructor]
    public Configuration(string value) : base(value) { }
    protected override int? MaxLength => ModelConstants.ShortMediumText;
    protected override bool AllowEmpty => true;
    public static Configuration New(string value) => new(value);
}

/// <summary>
/// Represents the current status of a Rubric in its lifecycle.
/// </summary>
public enum RubricStatus
{
    Draft = 0,

    Used = 1
}
