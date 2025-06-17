using AssignmentFlow.Application.Gradings;
using AssignmentFlow.IntegrationEvents;
using EventFlow.Commands;
using MassTransit;
using RubricEngine.Application.Protos;
using RubricService = RubricEngine.Application.Protos.RubricProtoService.RubricProtoServiceClient;
namespace AssignmentFlow.Application.Assessments.StartAutoGrading;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public required RubricId RubricId { get; init; }
    public required SubmissionApiContract Submission { get; init; }
}

public class CommandHandler(
    RubricService rubricService,
    IPublishEndpoint publishEndpoint) : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override async Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return;

        var rubric = await rubricService.GetRubricAsync(new GetRubricRequest
        {
            RubricId = command.RubricId
        }, cancellationToken: cancellationToken);

        var metadata = !string.IsNullOrWhiteSpace(rubric.MetadataJson) ? System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(rubric.MetadataJson) : [];

        await publishEndpoint.Publish<ISubmissionGradingStarted>(new
        {
            AssessmentId = aggregate.Id,
            Criteria = MapCriteria(command.Submission, rubric),
            Metadata = metadata,
            Attachments = rubric.Attachments.ToArray()
        },
        cancellationToken);

        aggregate.StartAutoGrading();
    }

    private static Criterion[] MapCriteria(SubmissionApiContract submission, RubricModel rubric)
        => [.. submission.CriteriaFiles.Join(rubric.Criteria,
            outerKeySelector: c => c.Criterion,
            innerKeySelector: c => c.Name,
            (submissionCriterion, rubricCriterion) => new Criterion
            {
                CriterionName = rubricCriterion.Name,
                FileRefs = [.. submissionCriterion.Files],
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
