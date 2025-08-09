using AssignmentFlow.Application.Gradings;
using AssignmentFlow.IntegrationEvents;
using EventFlow.Aggregates;
using EventFlow.Subscribers;
using MassTransit;
using RubricEngine.Application.Protos;
using RubricService = RubricEngine.Application.Protos.RubricProtoService.RubricProtoServiceClient;

namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class AutoGradingStartedEventSubscriber(
    GradingRepository repository,
    RubricService rubricService,
    IPublishEndpoint publishEndpoint)
    : ISubscribeSynchronousTo<AssessmentAggregate, AssessmentId, AutoGradingStartedEvent>
{
    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, AssessmentId, AutoGradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var rubric = await rubricService.GetRubricAsync(new GetRubricRequest
        {
            RubricId = domainEvent.AggregateEvent.RubricId.Value
        }, cancellationToken: cancellationToken);

        var submission = await repository.GetSubmissionAsync(
            domainEvent.AggregateEvent.GradingId,
            domainEvent.AggregateEvent.Reference,
            cancellationToken);

        var metadata = !string.IsNullOrWhiteSpace(rubric.MetadataJson) ? System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(rubric.MetadataJson) : [];
        metadata?.TryAdd("info", submission.Selectors);

        var criteria = MapCriteria(domainEvent.AggregateEvent.GradingId, submission, rubric);

        if (criteria.Length > 0)
        {
            await publishEndpoint.Publish<ISubmissionGradingStarted>(new
            {
                AssessmentId = domainEvent.GetIdentity(),
                Criteria = criteria,
                Metadata = metadata,
                Attachments = rubric.Attachments.Select(a => $"{rubric.Id}/{a}").ToArray(),
                GradingId = domainEvent.AggregateEvent.GradingId,
                Total = domainEvent.AggregateEvent.Total
            },
            cancellationToken);
        }
    }

    private static IntegrationEvents.Criterion[] MapCriteria(string gradingId, SubmissionApiContract submission, RubricModel rubric)
    => [.. submission.CriteriaFiles.Join(
            rubric.Criteria.Where(criterion => criterion.Plugin != "None" ), // Filter out criteria with "None" plugin
            outerKeySelector: c => c.Criterion,
            innerKeySelector: c => c.Name,
            (submissionCriterion, rubricCriterion) => new IntegrationEvents.Criterion
            {
                CriterionName = rubricCriterion.Name,
                FileRefs = [.. submissionCriterion.Files.Select(path => $"{gradingId}/{submission.Reference}/{path}")],
                Levels = [.. rubricCriterion.Levels.Select(l => new Level
                {
                    Tag = l.Tag,
                    Description = l.Description,
                    Weight = (decimal)l.Weight,
                })],
                Plugin = rubricCriterion.Plugin,
                Configuration = rubricCriterion.Configuration
            })];
}
