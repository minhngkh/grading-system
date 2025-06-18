using AssignmentFlow.Application.Gradings;
using AssignmentFlow.IntegrationEvents;
using EventFlow.Commands;
using MassTransit;
using RubricEngine.Application.Protos;
using RubricService = RubricEngine.Application.Protos.RubricProtoService.RubricProtoServiceClient;
namespace AssignmentFlow.Application.Assessments.StartAutoGrading;

public class Command(AssessmentId id) : Command<AssessmentAggregate, AssessmentId>(id)
{
    public RubricId? RubricId { get; set; } = null;
    public SubmissionApiContract? Submission { get; set; } = null;
}

public class CommandHandler(
    GradingRepository repository,
    RubricService rubricService,
    IPublishEndpoint publishEndpoint) : CommandHandler<AssessmentAggregate, AssessmentId, Command>
{
    public override async Task ExecuteAsync(AssessmentAggregate aggregate, Command command, CancellationToken cancellationToken)
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
            Criteria = MapCriteria(command.Submission, rubric),
            Metadata = metadata,
            Attachments = rubric.Attachments.Select(a => $"{rubric.Id}/{a}").ToArray()
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
