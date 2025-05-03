namespace AssignmentFlow.IntegrationEvents;

public class GradingStarted
{
    public required string TeacherId { get; init; }
    public required string GradingId { get; init; }
    public required string RubricId { get; init; }
}
