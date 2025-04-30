using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Assessments;

public class AssessmentAggregate : AggregateRoot<AssessmentAggregate, AssessmentId>
{
    private readonly ILogger<AssessmentAggregate> logger;

    public TeacherId TeacherId => State.TeacherId;

    internal readonly AssessmentWriteModel State;

    public AssessmentAggregate(
        AssessmentId id,
        ILogger<AssessmentAggregate> logger)
        : base(id)
    {
        State = new AssessmentWriteModel();
        this.logger = logger;

        Register(State);
    }

    public void CreateAssessment(Create.Command command)
    {

    }

    public void AdjustScore()
    {

    }

    public void UpdateFeedBack() { }
}

public class AssessmentId(string id) : Identity<AssessmentId>(id) { }