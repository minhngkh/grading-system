using EventFlow.Aggregates;

namespace AssignmentFlow.Application.Submissions;

internal class SubmissionWriteModel : AggregateState<SubmissionAggregate, SubmissionId, SubmissionWriteModel>
{
    public StudentId StudentId { get; private set; } = StudentId.Empty;
}