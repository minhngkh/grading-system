using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;

using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Assessments;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class Assessment
    : Identifiable<string>,
    IReadModel
{
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public override string Id { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string TeacherId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string GradingId { get; set; } = string.Empty;
    
    /// <summary>
    /// The final score after applying the scale factor.
    /// </summary>
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [NotMapped]
    public decimal Score => RawScore * ScaleFactor;

    /// <summary>
    /// The scale factor (e.g., 100 for a 0–100 scale, 5 for a 0–5 scale) applied at time of scoring.
    /// </summary>
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal ScaleFactor { get; set; }

    /// <summary>
    /// Gets or sets the raw score as a percentage (e.g., 84.5 for 84.5%).
    /// This value represents the unscaled achievement for this criterion or assessment.
    /// </summary>
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal RawScore { get; set; }
    
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public int AdjustedCount { get; set; } = 0;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<ScoreBreakdownApiContract> ScoreBreakdowns { get; set; } = [];

    [Attr(Capabilities = AllowView)]
    public List<FeedbackItemApiContract> Feedbacks { get; set; } = [];
}

/// <summary>
/// Represents a specific feedback item that may include file references and text positioning.
/// </summary>
[NoResource]
public class FeedbackItemApiContract
{
    public required string Criterion { get; set; }

    /// <summary>
    /// Gets or sets the file reference identifier.
    /// </summary>
    public required string FileRef { get; set; }

    /// <summary>
    /// Gets or sets the starting line number for this feedback.
    /// </summary>
    public required int FromLine { get; set; }

    /// <summary>
    /// Gets or sets the ending line number for this feedback.
    /// </summary>
    public required int ToLine { get; set; }

    /// <summary>
    /// Gets or sets the starting column number for this feedback.
    /// </summary>
    public required int FromCol { get; set; }

    /// <summary>
    /// Gets or sets the ending column number for this feedback.
    /// </summary>
    public required int ToCol { get; set; }

    /// <summary>
    /// Gets or sets the feedback comment text.
    /// </summary>
    public required string Comment { get; set; }

    public required string Tag { get; set; }
}