using EventFlow.Aggregates;
namespace AssignmentFlow.Application.Assessments;

public class AssessmentWriteModel
    : AggregateState<AssessmentAggregate, AssessmentId, AssessmentWriteModel>
{
    public TeacherId TeacherId { get; private set; } = TeacherId.Empty;

    public GradingId GradingId { get; private set; } = GradingId.Empty;

    public SubmissionReference Reference { get; private set; } = SubmissionReference.Empty;

    public ScaleFactor ScaleFactor { get; private set; } = ScaleFactor.TenPoint;

    public ScoreBreakdowns ScoreBreakdowns { get; private set; } = ScoreBreakdowns.Empty;

    public List<Feedback> Feedbacks { get; private set; } = [];                                                                                                                                                                                                                                              

    internal void Apply(Create.AssessmentCreatedEvent command)
    {
        TeacherId = command.TeacherId;
        GradingId = command.GradingId;
        Reference = command.SubmissionReference;
    }
}