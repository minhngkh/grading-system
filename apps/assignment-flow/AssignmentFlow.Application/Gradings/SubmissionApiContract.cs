using JsonApiDotNetCore.Resources.Annotations;

namespace AssignmentFlow.Application.Gradings;

public class SubmissionPersistence
{
    public string Reference { get; init; } = string.Empty;

    public List<string> Attachments { get; init; } = [];
}

/// <summary>
/// API contract representing a submission with its reference and criteria files.
/// Used for data transfer between API and client.
/// </summary>

[NoResource]
public class SubmissionApiContract
{
    /// <summary>
    /// The reference identifier for the submission.
    /// </summary>
    public string Reference { get; init; } = string.Empty;

    /// <summary>
    /// Dictionary mapping criterion names to their associated attachment files.
    /// </summary>
    public List<CriterionFilesApiContract> CriteriaFiles { get; init; } = [];
}

[NoResource]
public class CriterionFilesApiContract
{
    public string Criterion { get; init; } = string.Empty;
    public List<string> Files { get; init; } = [];
}