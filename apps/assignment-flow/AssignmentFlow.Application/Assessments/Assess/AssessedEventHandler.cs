using EventFlow.Aggregates;
using EventFlow.Subscribers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // Required for ILogger
using System;
using System.Threading;
using System.Threading.Tasks;

namespace AssignmentFlow.Application.Assessments.Assess;

public class AssessedEventHandler(
    AssignmentFlowDbContext dbContext,
    ILogger<AssessedEventHandler> logger) : ISubscribeAsynchronousTo<AssessmentAggregate, AssessmentId, AssessedEvent>
{
    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, AssessmentId, AssessedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var assessmentId = domainEvent.AggregateIdentity.Value;
        logger.LogInformation("Handling AssessedEvent for AssessmentId: {AssessmentId}", assessmentId);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        logger.LogInformation("Started database transaction for AssessmentId: {AssessmentId}", assessmentId);

        try
        {
            var assessment = await dbContext.Assessments.FindAsync([assessmentId], cancellationToken);
            if (assessment == null)
            {
                logger.LogWarning("Assessment with ID: {AssessmentId} not found.", assessmentId);
                ArgumentNullException.ThrowIfNull(assessment, nameof(assessment)); // This will throw
            }
            logger.LogInformation("Successfully retrieved Assessment with ID: {AssessmentId}", assessmentId);

            var currentScore = assessment.ScoreBreakdowns.ToValueObject();
            var newScoreFromEvent = domainEvent.AggregateEvent.ScoreBreakdowns;
            var deltaScore = newScoreFromEvent - currentScore;

            logger.LogInformation("Calculating scores for AssessmentId: {AssessmentId}. Current TotalRawScore: {CurrentScore}, New TotalRawScore: {NewScore}, Delta TotalRawScore: {DeltaScore}",
                assessmentId, currentScore.TotalRawScore, newScoreFromEvent.TotalRawScore, deltaScore.TotalRawScore);

            var scoreAdjustmentToCreate = CreateScoreAdjustment(assessment, domainEvent, newScoreFromEvent, deltaScore);
            logger.LogInformation("Creating ScoreAdjustment with ID: {ScoreAdjustmentId} for AssessmentId: {AssessmentId}", scoreAdjustmentToCreate.Id, assessmentId);

            dbContext.Add(scoreAdjustmentToCreate);
            await dbContext.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Saved ScoreAdjustment with ID: {ScoreAdjustmentId} to database for AssessmentId: {AssessmentId}", scoreAdjustmentToCreate.Id, assessmentId);

            var createdScoreAdjustment = await dbContext.ScoreAdjustments.FindAsync(
                [scoreAdjustmentToCreate.Id],
                cancellationToken);

            if (createdScoreAdjustment == null)
            {
                logger.LogError("Failed to find the ScoreAdjustment with ID: {ScoreAdjustmentId} immediately after saving within the transaction for AssessmentId: {AssessmentId}.",
                    scoreAdjustmentToCreate.Id, assessmentId);
                throw new InvalidOperationException($"Failed to find the ScoreAdjustment with ID {scoreAdjustmentToCreate.Id} immediately after saving within the transaction.");
            }
            logger.LogInformation("Successfully queried created ScoreAdjustment with ID: {ScoreAdjustmentId} within the transaction for AssessmentId: {AssessmentId}", createdScoreAdjustment.Id, assessmentId);

            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("Committed database transaction for AssessmentId: {AssessmentId}", assessmentId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error handling AssessedEvent for AssessmentId: {AssessmentId}. Rolling back transaction.", assessmentId);
            await transaction.RollbackAsync(cancellationToken); // Ensure rollback happens on error
            logger.LogInformation("Rolled back database transaction for AssessmentId: {AssessmentId}", assessmentId);
            throw;
        }
    }

    private static ScoreAdjustment CreateScoreAdjustment(
        Assessment assessment,
        IDomainEvent<AssessmentAggregate, AssessmentId, AssessedEvent> domainEvent,
        ScoreBreakdowns newScore,
        ScoreBreakdowns deltaScore)
    {
        return new ScoreAdjustment
        {
            Id = ScoreAdjustmentId.NewComb().Value,
            AssessmentId = assessment.Id,
            GradingId = assessment.GradingId,
            TeacherId = assessment.TeacherId,
            AdjustmentSource = domainEvent.AggregateEvent.Grader,
            Score = newScore.TotalRawScore,
            ScoreBreakdowns = newScore.ToApiContracts(),
            DeltaScore = deltaScore.TotalRawScore,
            DeltaScoreBreakdowns = deltaScore.ToApiContracts(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
