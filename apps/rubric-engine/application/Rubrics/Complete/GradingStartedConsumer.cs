using AssignmentFlow.IntegrationEvents;
using Azure.Storage.Blobs;
using EventFlow;
using EventFlow.Queries;
using MassTransit;

namespace RubricEngine.Application.Rubrics.Complete;

public class GradingStartedConsumer(
    ICommandBus commandBus,
    IQueryProcessor queryProcessor,
    BlobServiceClient client,
    ILogger<GradingStartedConsumer> logger)
    : IConsumer<GradingStarted>
{
    public async Task Consume(ConsumeContext<GradingStarted> context)
    {
        logger.LogInformation("Processing GradingStarted event. GradingId: {GradingId}, OriginalRubricId: {OriginalRubricId}, TeacherId: {TeacherId}.",
            context.Message.GradingId, context.Message.RubricId, context.Message.TeacherId);

        var originalRubricId = RubricId.With(context.Message.RubricId);
        
        // Fetch the original rubric's data
        var originalRubricData = await GetOriginalRubricAsync(originalRubricId, context.Message.GradingId, context.CancellationToken);

        // Generate a new ID for the cloned rubric
        var clonedRubricId = RubricId.New;
        logger.LogInformation("Initiating rubric clone. OriginalRubricId: {OriginalRubricId} -> ClonedRubricId: {ClonedRubricId}. GradingId: {GradingId}.",
            originalRubricId, clonedRubricId, context.Message.GradingId);

        // Clone the rubric in steps
        await CreateClonedRubricAsync(clonedRubricId, originalRubricData, context.CancellationToken);
        await CopyRubricAttachmentsAsync(clonedRubricId, originalRubricData, context.CancellationToken);
        await UpdateClonedRubricPropertiesAsync(clonedRubricId, originalRubricData, context.CancellationToken);
        await MarkOriginalRubricAsUsedAsync(originalRubricId, context.Message.GradingId, context.CancellationToken);

        logger.LogInformation("Successfully cloned rubric {OriginalRubricId} to {ClonedRubricId}. Original rubric {OriginalRubricId} marked as used. GradingId: {GradingId}.",
            originalRubricId, clonedRubricId, originalRubricId, context.Message.GradingId);
    }

    private async Task<Rubric> GetOriginalRubricAsync(RubricId originalRubricId, string gradingId, CancellationToken cancellationToken)
    {
        var originalRubricData = await queryProcessor.ProcessAsync(
            new ReadModelByIdQuery<Rubric>(originalRubricId),
            cancellationToken);

        return originalRubricData
            ?? throw new InvalidOperationException($"Original rubric {originalRubricId} not found. Cloning process aborted for GradingId: {gradingId}."); ;
    }

    private async Task CreateClonedRubricAsync(RubricId clonedRubricId, Rubric originalRubricData, CancellationToken cancellationToken)
    {
        var createCommand = new Create.Command(
            clonedRubricId,
            TeacherId.With(originalRubricData.TeacherId)
        );
        await commandBus.PublishAsync(createCommand, cancellationToken);
    }

    private async Task UpdateClonedRubricPropertiesAsync(RubricId clonedRubricId, Rubric originalRubricData, CancellationToken cancellationToken)
    {
        var updateCommand = new Update.Command(clonedRubricId)
        {
            Name = RubricName.New(originalRubricData.RubricName),
            PerformanceTags = originalRubricData.PerformanceTags.ToPerformanceTags(),
            Criteria = originalRubricData.Criteria.ToCriteria(),
            Metadata = originalRubricData.Metadata,
            Attachments = originalRubricData.Attachments
        };
        await commandBus.PublishAsync(updateCommand, cancellationToken);
    }

    private async Task CopyRubricAttachmentsAsync(RubricId clonedRubricId, Rubric originalRubricData, CancellationToken cancellationToken)
    {
        var originalAttachments = originalRubricData.Attachments ?? [];
        var newAttachments = new List<string>();
        
        // Create tasks for parallel processing
        var copyTasks = originalAttachments.Select(async attachment => 
        {
            await CopyBlobAsync(
                sourceBlobName: $"{originalRubricData.Id}/{attachment}",
                destBlobName: $"{clonedRubricId}/{attachment}",
                cancellationToken: cancellationToken);
        }).ToList();

        // Wait for all copy operations to complete and collect results
        await Task.WhenAll(copyTasks);
    }

    private async Task MarkOriginalRubricAsUsedAsync(RubricId originalRubricId, string gradingId, CancellationToken cancellationToken)
    {
        var completeCommand = new Complete.Command(originalRubricId)
        {
            GradingId = gradingId
        };
        await commandBus.PublishAsync(completeCommand, cancellationToken);
    }

    private async Task CopyBlobAsync(
        string sourceBlobName,
        string destBlobName,
        CancellationToken cancellationToken)
    {
        var container = client.GetBlobContainerClient("rubric-context-store");
        var sourceBlobClient = container.GetBlobClient(sourceBlobName);
        var destinationBlobClient = container.GetBlobClient(destBlobName);
        
        await destinationBlobClient.StartCopyFromUriAsync(
            sourceBlobClient.Uri,
            cancellationToken: cancellationToken);
    }
}
