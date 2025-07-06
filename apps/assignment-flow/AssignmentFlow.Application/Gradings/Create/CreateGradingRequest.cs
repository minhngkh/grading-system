namespace AssignmentFlow.Application.Gradings.Create;

public static partial class EndpointHandler
{
    public sealed class CreateGradingRequest
    {
        public string? RubricId { get; set; }
        public string? Name { get; set; }
        public decimal? ScaleFactor { get; set; } = null;
    }
}
