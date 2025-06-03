using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSagaWriteModel :
    AggregateState<GradingSaga, GradingSagaId, GradingSagaWriteModel>,
    IEventApplier<GradingSaga, GradingSagaId>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public GradingId GradingId { get; private set; } = null!;
    public RubricId RubricId { get; private set; } = RubricId.Empty;

    public HashSet<SubmissionReference> PendingSubmissionRefs { get; private set; } = [];
    public HashSet<AssessmentId> PendingAssessmentIds { get; private set; } = [];
    public HashSet<AssessmentId> UnderAutoGradingAssessmentIds { get; private set; } = [];
    public HashSet<AssessmentId> GradedAssessmentIds { get; private set; } = [];

    public HashSet<AssessmentId> FailedAssessmentIds { get; private set; } = [];

    internal void Apply(GradingSagaStartedEvent e)
    {
        TeacherId = e.TeacherId;
        GradingId = e.GradingId;
        RubricId = e.RubricId;

        foreach (var submission in e.SubmissionReferences)
        {
            PendingSubmissionRefs.Add(submission);
        }
    }

    internal void Apply(GradingSagaAssessmentTrackedEvent e)
    {
        PendingSubmissionRefs.Remove(e.SubmissionReference);
        PendingAssessmentIds.Add(e.AssessmentId);
    }

    internal void Apply(GradingSagaAssessmentAutoGradingStartedEvent e)
    {
        PendingAssessmentIds.Remove(e.AssessmentId);
        UnderAutoGradingAssessmentIds.Add(e.AssessmentId);
    }

    internal void Apply(GradingSagaAssessmentAutoGradingFinishedEvent e)
    {
        UnderAutoGradingAssessmentIds.Remove(e.AssessmentId);
        GradedAssessmentIds.Add(e.AssessmentId);
    }
}
