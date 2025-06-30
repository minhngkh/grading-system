using AssignmentFlow.Application.Gradings;
using AssignmentFlow.IntegrationEvents;
using EventFlow.Commands;
using MassTransit;
using RubricEngine.Application.Protos;
using RubricService = RubricEngine.Application.Protos.RubricProtoService.RubricProtoServiceClient;
namespace AssignmentFlow.Application.Assessments.AutoGrading;

public class StartAutoGradingCommand(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public RubricId? RubricId { get; set; } = null;
    public SubmissionApiContract? Submission { get; set; } = null;
}

public class StartAutoGradingCommandHandler(
    GradingRepository repository,
    RubricService rubricService,
    IPublishEndpoint publishEndpoint) : CommandHandler<AssessmentAggregate, AssessmentId, StartAutoGradingCommand>
{
    public override async Task ExecuteAsync(AssessmentAggregate aggregate, StartAutoGradingCommand command, CancellationToken cancellationToken)
    {
        if (aggregate.IsNew)
            return;

        var rubric = await rubricService.GetRubricAsync(new GetRubricRequest
        {
            RubricId = command.RubricId ?? aggregate.State.RubricId
        }, cancellationToken: cancellationToken);
        var metadata = !string.IsNullOrWhiteSpace(rubric.MetadataJson) ? System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object?>>(rubric.MetadataJson) : [];

        command.Submission ??= await repository.GetSubmissionAsync(aggregate.State.GradingId, aggregate.State.Reference, cancellationToken);

        await publishEndpoint.Publish<ISubmissionGradingStarted>(new
        {
            AssessmentId = aggregate.Id,
            Criteria = MapCriteria(aggregate.State.GradingId, command.Submission, rubric),
            Metadata = metadata,
            Attachments = rubric.Attachments.Select(a => $"{rubric.Id}/{a}").ToArray()
        },
        cancellationToken);

        aggregate.StartAutoGrading();
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
