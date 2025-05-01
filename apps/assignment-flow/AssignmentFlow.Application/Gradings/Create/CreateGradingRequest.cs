namespace AssignmentFlow.Application.Gradings.Create;

public class CreateGradingRequest
{
    public string RubricId { get; init; } = string.Empty;
    public decimal ScaleFactor { get; init; } = 10M; // optional, default to 10
    public List<CriterionAttachmentsSelectorApiContract> AttachmentsSelectors { get; set; } = [];
}
