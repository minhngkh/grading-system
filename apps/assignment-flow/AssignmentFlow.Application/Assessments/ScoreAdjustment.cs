using System.ComponentModel.DataAnnotations;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;

using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Assessments;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class ScoreAdjustment : Identifiable<string>
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

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string AssessmentId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal Score { get; set; } = 0M;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal DeltaScore { get; set; } = 0M;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public string AdjustmentSource { get; set; } = ScoreAdjustmentSource.Teacher.ToString();

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<ScoreBreakdownApiContract> ScoreBreakdowns { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public List<ScoreBreakdownApiContract> DeltaScoreBreakdowns { get; set; } = [];
}

public enum ScoreAdjustmentSource
{
    Teacher = 1,
    AI = 2
}