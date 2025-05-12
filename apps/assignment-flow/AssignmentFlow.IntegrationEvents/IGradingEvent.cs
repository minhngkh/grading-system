namespace AssignmentFlow.IntegrationEvents;

public interface IGradingEvent
{
    public string GradingId { get; set; }
    public string TeacherId { get; set; }
}
