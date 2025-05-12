using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.Create;

public class SubmissionGradedConsumer(
    ICommandBus commandBus,
    ILogger<SubmissionGradedConsumer> logger) : IConsumer<ISubmissionGradingResult>
{
    public async Task Consume(ConsumeContext<ISubmissionGradingResult> context)
    {
        var assessmentId = AssessmentId.NewComb();
        var (scoreBreakdowns, feedbacks) = context.Message.ScoreBreakdowns.ToValueObject();
        await commandBus.PublishAsync(new Command(assessmentId)
        {
            ScoreBreakdowns = scoreBreakdowns,
            Feedbacks = feedbacks,
            SubmissionReference = SubmissionReference.New(context.Message.SubmissionReference),
            GradingId = context.Message.GradingId,
            TeacherId = TeacherId.With(context.Message.TeacherId)
        },
        context.CancellationToken);
    }
}
