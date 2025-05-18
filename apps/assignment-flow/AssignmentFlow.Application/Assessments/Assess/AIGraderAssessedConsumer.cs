using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.Assess;

public class AIGraderAssessedConsumer(
    ICommandBus commandBus,
    ILogger<AIGraderAssessedConsumer> logger) : IConsumer<ISubmissionGradingResult>
{
    public async Task Consume(ConsumeContext<ISubmissionGradingResult> context)
    {
        var assessmentId = AssessmentId.NewComb();
        var (scoreBreakdowns, feedbacks) = context.Message.ScoreBreakdowns.ToValueObject();
        await commandBus.PublishAsync(new Command(assessmentId)
        {
            ScoreBreakdowns = scoreBreakdowns,
            Feedbacks = feedbacks,
        },
        context.CancellationToken);
    }
}
