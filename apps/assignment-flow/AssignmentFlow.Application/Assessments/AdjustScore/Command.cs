using EventFlow.Commands;

namespace AssignmentFlow.Application.Assessments.AdjustScore;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{

}