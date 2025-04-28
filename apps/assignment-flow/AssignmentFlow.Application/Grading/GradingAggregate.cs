using System.Collections.Generic;
using AssignmentFlow.Application.Grading.Start;
using EventFlow.Aggregates;
using EventFlow.Core;

namespace AssignmentFlow.Application.Grading;

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

    public void StartGrading(Start.Command command)
    {
        Emit(new GradingStartedEvent
        {
            TeacherId = command.TeacherId,
            RubricId = command.RubricId,
            Criteria = command.CriteriaFilesMappings
        });
    }

    public void AddSubmission(List<Uri> uris)
    {
        // Create criteria-files mappings
        var criteriaFiles = new Dictionary<CriterionIdentity, List<Attachment>>();
        foreach (var mapping in State.CriteriaFilesMappings)
        {
            //Get BlobReferences from
            criteriaFiles[mapping.Identity] = uris
                .Where(uri => uri.AbsoluteUri.Contains(mapping.ContentSelectorStrategy.Name))
                .Select(uri => new Attachment(uri.ToString()))
                .ToList();
        }

        //Emit(new SubmissionAddedEvent(uri));
    }
}

public class GradingId(string id) : Identity<GradingId>(id) { }