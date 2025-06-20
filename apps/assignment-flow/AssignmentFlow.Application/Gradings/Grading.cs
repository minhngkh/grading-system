﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AssignmentFlow.Application.Gradings.ChangeRubric;
using AssignmentFlow.Application.Gradings.Create;
using AssignmentFlow.Application.Gradings.RemoveSubmission;
using AssignmentFlow.Application.Gradings.Start;
using AssignmentFlow.Application.Gradings.UpdateCriterionSelectors;
using AssignmentFlow.Application.Gradings.UpdateScaleFactor;
using AssignmentFlow.Application.Gradings.UploadSubmission;
using EventFlow.Aggregates;
using EventFlow.ReadStores;
using JsonApiDotNetCore.Resources;
using JsonApiDotNetCore.Resources.Annotations;
using static JsonApiDotNetCore.Resources.Annotations.AttrCapabilities;

namespace AssignmentFlow.Application.Gradings;

public class Grading
    : Identifiable<string>,
    IReadModel,
    IAmReadModelFor<GradingAggregate, GradingId, GradingCreatedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, SelectorsUpdatedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, ScaleFactorUpdatedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, RubricChangedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, SubmissionAddedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, SubmissionRemovedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, AutoGradingStartedEvent>,
    IAmReadModelFor<GradingAggregate, GradingId, AutoGradingFinishedEvent>
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
    public decimal ScaleFactor { get; set; }

    [Attr(Capabilities = AllowView)]
    public List<SelectorApiContract> Selectors { get; set; } = [];

    [Attr(Capabilities = AllowView | AllowSort | AllowFilter)]
    [NotMapped]
    public List<SubmissionApiContract> Submissions
        => SubmissionPersistences.ConvertAll(s => new SubmissionApiContract
        {
            Reference = s.Reference,
            CriteriaFiles = Selectors.ConvertAll(selector => new CriterionFilesApiContract
            {
                Criterion = selector.Criterion,
                Files = [.. s.Attachments.Where(attachment => {
                    //"http://127.0.0.1:27000/devstoreaccount1/submissions-store/grading-3a2508d0-906d-08dd-2ca9-aa917e2110cc/psd.pdf"
                    var path = attachment[attachment.IndexOf(Id)..];
                    return Pattern.New(selector.Pattern).Match(Id, path);
                })]
            })
        });
    
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
    
    public bool IsActionAllowed(string action) => StateMachine.PermittedTriggers.Any(a => Enum.GetName(a) == action);
    
    public Task ApplyAsync(
        IReadModelContext context,
        IDomainEvent<GradingAggregate, GradingId, GradingCreatedEvent> domainEvent,
        CancellationToken cancellationToken)
    {
        TeacherId = domainEvent.AggregateEvent.TeacherId.Value;

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(
        IReadModelContext context,
        IDomainEvent<GradingAggregate, GradingId, SelectorsUpdatedEvent> domainEvent,
        CancellationToken cancellationToken)
    {
        Selectors = domainEvent.AggregateEvent.Selectors
            .ConvertAll(s => new SelectorApiContract
            {
                Criterion = s.Criterion,
                Pattern = s.Pattern
            });
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, ScaleFactorUpdatedEvent> domainEvent, CancellationToken cancellationToken)
    {
        ScaleFactor = domainEvent.AggregateEvent.ScaleFactor;
        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, RubricChangedEvent> domainEvent, CancellationToken cancellationToken)
    {
        RubricId = domainEvent.AggregateEvent.RubricId.Value;
        Selectors = [];
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

    public Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, SubmissionRemovedEvent> domainEvent, CancellationToken cancellationToken)
    {
        SubmissionPersistences.RemoveAll(s => s.Reference == domainEvent.AggregateEvent.RemovedSubmission);

        UpdateLastModifiedData(domainEvent);
        return Task.CompletedTask;
    }

    public async Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, AutoGradingStartedEvent> domainEvent, CancellationToken cancellationToken)
    {
        await StateMachine.FireAsync(GradingTrigger.Start);
        UpdateLastModifiedData(domainEvent);
    }

    public async Task ApplyAsync(IReadModelContext context, IDomainEvent<GradingAggregate, GradingId, AutoGradingFinishedEvent> domainEvent, CancellationToken cancellationToken)
    {
        await StateMachine.FireAsync(GradingTrigger.FinishGrading);
        UpdateLastModifiedData(domainEvent);
    }

    private void UpdateLastModifiedData(IDomainEvent domainEvent)
    {
        LastModified = domainEvent.Timestamp.ToUniversalTime();
        Version = domainEvent.AggregateSequenceNumber;
    }
}
