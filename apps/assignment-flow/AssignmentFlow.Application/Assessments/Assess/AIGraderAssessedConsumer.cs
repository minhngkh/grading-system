using AssignmentFlow.IntegrationEvents;
using EventFlow;
using MassTransit;

namespace AssignmentFlow.Application.Assessments.Assess;

[Obsolete("Integration event changed to Criterion-level one")]
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
                Errors = context.Message.Errors.ToDictionary(e => e.CriterionName, e => e.Error)
            },
            context.CancellationToken
        );
    }
}
