namespace AssignmentFlow.IntegrationEvents;

public class FeedbackItem
{
    public required string Comment { get; set; }
    public required string FileRef { get; set; }
    public required string Tag { get; set; }
    public required int FromCol { get; set; }
    public required int ToCol { get; set; }
    public int FromLine { get; set; } = 0;
    public int ToLine { get; set; } = 0;
}
