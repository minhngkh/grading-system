using AssignmentFlow.IntegrationEvents;
using EventFlow.Aggregates;
using EventFlow.Subscribers;
using MassTransit;
using RubricEngine.Application.Protos;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingStartedSubscriber(
    GradingRepository repository,
    RubricProtoService.RubricProtoServiceClient rubricProtoService,
    IPublishEndpoint publishEndpoint,
    ILogger<GradingStartedSubscriber> logger)
    : ISubscribeSynchronousTo<GradingAggregate, GradingId, GradingStartedEvent>
{
    public async Task HandleAsync(IDomainEvent<GradingAggregate, GradingId, GradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var gradingSummary = await repository
            .GetGradingSummary(domainEvent.AggregateIdentity.Value, cancellationToken);
        var rubric = await rubricProtoService.GetRubricAsync(new GetRubricRequest
        {
            RubricId = gradingSummary.RubricId
        }, cancellationToken: cancellationToken);

        //TODO: Introduce Serilog
        logger.LogInformation("Grading started for {GradingId} with rubric {RubricId}", gradingSummary.Id, gradingSummary.RubricId);
        foreach (var submission in gradingSummary.Submissions)
        {
            logger.LogInformation("Grading submission {SubmissionReference} for {GradingId}", submission.Reference, gradingSummary.Id);
            await publishEndpoint.Publish<ISubmissionGradingStarted>(new 
            {
                //TODO: Construct the event
            },
            cancellationToken);
        }
        logger.LogInformation("Grading completed for {GradingId} with rubric {RubricId}", gradingSummary.Id, gradingSummary.RubricId);
    }
}
