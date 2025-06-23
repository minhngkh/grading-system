using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSagaWriteModel :
    AggregateState<GradingSaga, GradingSagaId, GradingSagaWriteModel>,
    IEventApplier<GradingSaga, GradingSagaId>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;
    public Shared.GradingId GradingId { get; private set; } = Shared.GradingId.Empty;
    public RubricId RubricId { get; private set; } = RubricId.Empty;


    public HashSet<SubmissionReference> PendingSubmissionRefs { get; private set; } = [];
    public HashSet<AssessmentId> PendingAssessmentIds { get; private set; } = [];
    public HashSet<AssessmentId> UnderAutoGradingAssessmentIds { get; private set; } = [];
    public HashSet<AssessmentId> GradedAssessmentIds { get; private set; } = [];

    public HashSet<AssessmentId> FailedAssessmentIds { get; private set; } = [];

    public Dictionary<AssessmentId, SubmissionReference> AssessmentToSubmissionRefs { get; private set; } = [];

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
        AssessmentToSubmissionRefs[e.AssessmentId] = e.SubmissionReference;
    }

    internal void Apply(GradingSagaAssessmentAutoGradingStartedEvent e)
    {
        PendingAssessmentIds.Remove(e.AssessmentId);
        GradedAssessmentIds.Remove(e.AssessmentId); // Ensure it's not marked as graded if it was previously
        FailedAssessmentIds.Remove(e.AssessmentId); // Ensure it's not marked as failed if it was previously

        UnderAutoGradingAssessmentIds.Add(e.AssessmentId);
    }

    internal void Apply(GradingSagaAssessmentAutoGradingFinishedEvent e)
    {
        UnderAutoGradingAssessmentIds.Remove(e.AssessmentId);
        GradedAssessmentIds.Add(e.AssessmentId);
    }

    internal void Apply(GradingSagaAssessmentAutoGradingFailedEvent e)
    {
        UnderAutoGradingAssessmentIds.Remove(e.AssessmentId);
        FailedAssessmentIds.Add(e.AssessmentId);
    }
}
