using EventFlow.ValueObjects;

namespace AssignmentFlow.Application.Shared;

public class Criterion : ValueObject
{
    public string Name { get; init; } = string.Empty;
    public ContentSelectorStrategy Selector { get; init; } // Selector strategy for content extraction
}

public abstract class ContentSelectorStrategy : ValueObject
{
    public string Name { get; init; } = string.Empty;
}

public class RegexSelectorStrategy : ContentSelectorStrategy
{
    public string Regex { get; init; } = string.Empty;
}

public class XPathSelectorStrategy : ContentSelectorStrategy
{
    public string XPath { get; init; } = string.Empty;
}

public class JsonPathSelectorStrategy : ContentSelectorStrategy
{
    public string JsonPath { get; init; } = string.Empty;
}
