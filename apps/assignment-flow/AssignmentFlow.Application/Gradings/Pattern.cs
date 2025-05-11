using Microsoft.Extensions.FileSystemGlobbing;
using Newtonsoft.Json;

namespace AssignmentFlow.Application.Gradings;

/// <summary>
/// Represents a pattern for filtering file entries using Microsoft's file globbing patterns.
/// </summary>
/// <remarks>
/// This class uses the Microsoft.Extensions.FileSystemGlobbing library to provide
/// powerful file matching capabilities with standard glob syntax.
/// </remarks>
public sealed class Pattern : StringValueObject
{
    private readonly Matcher _matcher;
    private readonly bool _isWildcard;
    
    /// <summary>
    /// Gets a pattern that matches everything.
    /// </summary>
    public static Pattern All => new("**/*");
    
    /// <summary>
    /// Gets an empty pattern that doesn't match anything.
    /// </summary>
    public static Pattern Empty => new(string.Empty);
    
    /// <summary>
    /// Initializes a new instance of the <see cref="Pattern"/> class from a JSON representation.
    /// </summary>
    /// <param name="value">The pattern string using glob syntax.</param>
    [JsonConstructor]
    public Pattern(string value) : base(value)
    {
        _isWildcard = value is "*" or "**/*";
        _matcher = new Matcher();
        
        if (string.IsNullOrWhiteSpace(value))
            return;
            
        if (_isWildcard)
            _matcher.AddInclude("**/*");
        else
            ParsePatterns(value);
    }
    
    private void ParsePatterns(string value)
    {
        var patterns = value.Split([','], StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToList();
            
        foreach (var pattern in patterns)
        {
            if (pattern.StartsWith('!'))
            {
                // Exclusion pattern
                _matcher.AddExclude(pattern[1..]);
            }
            else
            {
                // Inclusion pattern
                _matcher.AddInclude(pattern);
            }
        }
    }
    
    /// <summary>
    /// Gets the maximum length of the pattern string.
    /// </summary>
    protected override int? MaxLength => ModelConstants.MediumLongText;
    
    /// <summary>
    /// Creates a new pattern with the specified value.
    /// </summary>
    /// <param name="value">The pattern string using glob syntax.</param>
    /// <returns>A new <see cref="Pattern"/> instance.</returns>
    public static Pattern New(string value) => new(value);
    
    /// <summary>
    /// Determines whether the specified string matches this pattern.
    /// </summary>
    /// <param name="value">The string to check for a match.</param>
    /// <returns>
    /// <c>true</c> if the specified string matches this pattern; otherwise, <c>false</c>.
    /// </returns>
    public bool Match(string rootDir, string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        if (_isWildcard)
            return true;
            
        // Use the direct matching method
        return _matcher.Match(rootDir, value).HasMatches;
    }
    
    /// <summary>
    /// Returns a string that represents the current pattern.
    /// </summary>
    /// <returns>A string that represents the current pattern.</returns>
    public override string ToString() => Value;
}