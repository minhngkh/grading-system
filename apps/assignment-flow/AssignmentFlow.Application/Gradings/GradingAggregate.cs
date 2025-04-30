using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Shared;
using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Gradings;

public class GradingAggregate : AggregateRoot<GradingAggregate, GradingId>
{
    private readonly ILogger<GradingAggregate> logger;
    public TeacherId TeacherId => State.TeacherId;
    public readonly GradingWriteModel State;
    public GradingAggregate(
        GradingId id,
        ILogger<GradingAggregate> logger)
        : base(id)
    {
        State = new GradingWriteModel();
        this.logger = logger;
        Register(State);
    }

    public void StartGrading(Command command)
    {
        Emit(new GradingStartedEvent
        {
            TeacherId = command.TeacherId,
            RubricId = command.RubricId,
            Selectors = command.CriterionAttachmentsSelectors
        });
    }

    //TODO: Handle difference selection strategies
    public void AddSubmission(List<Uri> uris)
    {
        // Create criteria-files mappings
        var criteriaFiles = new Dictionary<CriterionName, List<Attachment>>();
        foreach (var mapping in State.CriteriaFilesMappings)
        {
            //Get BlobReferences from
            criteriaFiles[mapping.Criterion] = uris
                .Where(uri => uri.AbsoluteUri.Contains(mapping.ContentSelector.Pattern))
                .Select(uri => new Attachment(uri.ToString()))
                .ToList();
        }

        //Emit(new SubmissionAddedEvent(uri));
    }
}

public class GradingId(string id) : Identity<GradingId>(id) { }