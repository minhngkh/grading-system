namespace AssignmentFlow.IntegrationEvents;

public class FeedbackItem
{
    public required string Comment { get; set; }
    public required string FileRef { get; set; }
    public required string Tag { get; set; } // TODO: remove
    public int FromCol { get; set; }
    public int ToCol { get; set; }
    public required int FromLine { get; set; } = 0;
    public required int ToLine { get; set; } = 0;
}
