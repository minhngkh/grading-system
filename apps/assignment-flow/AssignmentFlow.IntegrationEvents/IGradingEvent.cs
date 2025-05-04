namespace AssignmentFlow.IntegrationEvents;

public interface IGradingEvent
{
    public string TeacherId { get; init; }
    public string GradingId { get; init; }
    public string RubricId { get; init; }
}
