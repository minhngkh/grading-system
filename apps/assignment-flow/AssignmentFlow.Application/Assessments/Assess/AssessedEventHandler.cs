using EventFlow.Aggregates;
using EventFlow.Subscribers;

namespace AssignmentFlow.Application.Assessments.Assess;

public class AssessedEventHandler(AssignmentFlowDbContext dbContext) : ISubscribeAsynchronousTo<AssessmentAggregate, AssessmentId, AssessedEvent>
{
    public async Task HandleAsync(IDomainEvent<AssessmentAggregate, AssessmentId, AssessedEvent> domainEvent, CancellationToken cancellationToken)
    {
        var assessment = await dbContext.Assessments.FindAsync([domainEvent.AggregateIdentity.Value], cancellationToken);
        ArgumentNullException.ThrowIfNull(assessment, nameof(assessment));

        var currentScore = assessment.ScoreBreakdowns.ToValueObject();
        var newScore = domainEvent.AggregateEvent.ScoreBreakdowns;
        var deltaScore = newScore - currentScore;

        var scoreAdjustment = new ScoreAdjustment
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
        };

        dbContext.Add(scoreAdjustment);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
