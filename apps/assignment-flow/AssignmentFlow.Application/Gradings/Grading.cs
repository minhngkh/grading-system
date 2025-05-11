using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AssignmentFlow.Application.Gradings.Create;
using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Controllers;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;
using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Gradings;

[Resource(GenerateControllerEndpoints = JsonApiEndpoints.Query)]
public class Grading
    : Identifiable<string>,
    IReadModel,
    IAmReadModelFor<GradingAggregate, GradingId, GradingCreatedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, SubmissionAddedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, GradingStartedEvent>
{
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public override string Id { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string TeacherId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string RubricId { get; set; } = string.Empty;

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public decimal ScaleFactor { get; set; } = 10M;

    [Attr(Capabilities = AllowView)]
    public List<SelectorApiContract> Selectors { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [NotMapped]
    public List<SubmissionApiContract> Submissions
    {
        get
        {
            var submissionsByReference = SubmissionPersistences
                .GroupBy(s => s.Reference)
                .ToDictionary(g => g.Key, g => g.ToList());

            return Selectors.ConvertAll(selector => new SubmissionApiContract
            {
                Reference = selector.Criterion,
                CriteriaFiles = submissionsByReference
                    .TryGetValue(selector.Criterion, out var matchingSubmissions)
                    ? matchingSubmissions.ConvertAll
                        (sub => new CriterionFilesApiContract
                        {
                            Criterion = selector.Criterion,
                            Files = [.. sub.Attachments.Where(attachment =>
                                    Pattern.New(selector.Pattern).Match(string.Empty, attachment))]
                        })
                    : []
            }); 
        }
    }

    public List<SubmissionPersistence> SubmissionPersistences { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    public DateTimeOffset LastModified { get; set; }

    [Attr(Capabilities = AllowView)]
    public int Version { get; private set; }
    
    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [MaxLength(ModelConstants.ShortText)]
    public string Status { get; set; } = nameof(GradingState.Created);
    
    public GradingStateMachine StateMachine => new(() => Enum.Parse<GradingState>(Status), AfterStateUpdated);

    private void AfterStateUpdated(GradingState newState) => Status = Enum.GetName(newState) ?? throw new InvalidOperationException();

    private void UpdateLastModifiedData(IDomainEvent domainEvent)
    {
        LastModified = domainEvent.Timestamp.ToUniversalTime();
        Version = domainEvent.AggregateSequenceNumber;
    }
    
    public bool IsActionAllowed(string action) => StateMachine.PermittedTriggers.Any(a => Enum.GetName(a) == action);
    
    public Task ApplyAsync(
        IReadModelContext context,
        IDomainEvent<GradingAggregate, GradingId, GradingCreatedEvent> domainEvent,
        CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId.Value;
        RubricId = domainEvent.AggregateEvent.RubricId.Value;
        ScaleFactor = domainEvent.AggregateEvent.ScaleFactor;
        Selectors = domainEvent.AggregateEvent.Selectors
            .ConvertAll(s => new SelectorApiContract
            {
                Criterion = s.Criterion,
                Pattern = s.Pattern
            });

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, SubmissionAddedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var submission = domainEvent.AggregateEvent.Submission;
        SubmissionPersistences.Add(new()
        {
            Reference = submission.Reference.Value,
            Attachments = submission.Attachments.ConvertAll(a => a.Value)
        });
        
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public async Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, GradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        await StateMachine.FireAsync(GradingTrigger.Start);
    }
}