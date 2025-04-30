using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.Create;

public class SubmissionGradedConsumer(
    ICommandBus commandBus,
    ILogger<SubmissionGradedConsumer> logger) : IConsumer<SubmissionGradedEvent>
{
    public async Task Consume(ConsumeContext<SubmissionGradedEvent> context)
    {
        var gradedEvent = context.Message;
        logger.LogInformation("Consuming SubmissionGradedEvent for grading {GradingId}", gradedEvent.GradingId);

        var assessmentId = AssessmentId.NewComb();
        await commandBus.PublishAsync(new Command(assessmentId)
        {
            TeacherId = TeacherId.New(gradedEvent.TeacherId),
            GradingId = gradedEvent.GradingId,
            SubmissionId = gradedEvent.SubmissionId,
            ScoreBreakdowns = gradedEvent.ScoreBreakdownDtos.ToScoreBreakdowns()
        },context.CancellationToken);

        logger.LogInformation("Assessment creation initiated for grading {GradingId}", gradedEvent.GradingId);
    }
}
