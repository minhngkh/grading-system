using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.Assess;

public class AIGraderAssessedConsumer(
    ICommandBus commandBus,
    ILogger<AIGraderAssessedConsumer> logger
) : IConsumer<ISubmissionGradingResult>
{
    public async Task Consume(ConsumeContext<ISubmissionGradingResult> context)
    {
        logger.LogInformation(
            "received: {AssessmentId}, ScoreBreakdowns: {ScoreBreakdowns}, Errors: {Errors}",
            context.Message.AssessmentId,
            context.Message.ScoreBreakdowns,
            context.Message.Errors
        );

        var assessmentId = AssessmentId.With(context.Message.AssessmentId);
        var (scoreBreakdowns, feedbacks) =
            context.Message.ScoreBreakdowns.ToValueObject();
        await commandBus.PublishAsync(
            new Command(assessmentId)
            {
                ScoreBreakdowns = scoreBreakdowns,
                Feedbacks = feedbacks,
                Grader = Grader.AIGrader,
            },
            context.CancellationToken
        );
    }
}
