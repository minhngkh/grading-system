using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.Assess;

public class SubmissionGradedConsumer(
    ICommandBus commandBus,
    ILogger<SubmissionGradedConsumer> logger) : IConsumer<SubmissionGraded>
{
    public async Task Consume(ConsumeContext<SubmissionGraded> context)
    {
        var assessmentId = AssessmentId.With(context.Message.AssessmentId);
        await commandBus.PublishAsync(new Command(assessmentId)
        {
            ScoreBreakdowns = context.Message.ScoreBreakdownDtos.ToScoreBreakdowns()
        },context.CancellationToken);
    }
}
