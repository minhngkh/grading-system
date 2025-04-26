using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Submissions;

public class SubmissionAggregate : AggregateRoot<SubmissionAggregate, SubmissionId>
{
    private readonly ILogger<SubmissionAggregate> logger;
    internal readonly SubmissionWriteModel State;
    public SubmissionAggregate(
        SubmissionId id,
        ILogger<SubmissionAggregate> logger)
        : base(id)
    {
        State = new SubmissionWriteModel();
        this.logger = logger;
        Register(State);
    }
}

public class SubmissionId(string id) : Identity<SubmissionId>(id) { }