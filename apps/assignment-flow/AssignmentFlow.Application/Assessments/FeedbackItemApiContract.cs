using JsonApiDotNetCore.Resources.Annotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace AssignmentFlow.Application.Assessments;

/// <summary>
/// Represents a specific feedback item that may include file references and text positioning.
/// </summary>
[NoResource]
public class FeedbackItemApiContract
{
    public required string Criterion { get; set; }
    public required string FileRef { get; set; }

    //[JsonIgnore]: TODO: Keep this commented until we can make sure this works
    public string LocationDataJson { get; set; } = string.Empty;

    [NotMapped]
    public Dictionary<string, object?> LocationData
    {
        get => string.IsNullOrEmpty(LocationDataJson) ? [] : (System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(LocationDataJson) ?? []);
        set => LocationDataJson = JsonSerializer.Serialize(value);
    }

    public required string Comment { get; set; }
    public required string Tag { get; set; }
    public required string Author { get; set; } = string.Empty; // Author can be empty for AI-generated feedback
}
