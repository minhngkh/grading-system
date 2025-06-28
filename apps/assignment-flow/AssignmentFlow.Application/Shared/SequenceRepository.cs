using Sqids;

namespace AssignmentFlow.Application.Shared;

public interface ISequenceRepository<T>
{
    Task<string> GenerateSequence();
}

public class SequenceRepository<T>(AssignmentFlowDbContext dbContext) : ISequenceRepository<T>
{
    private readonly SqidsOptions options = new()
    {
        Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        MinLength = 6, // Minimum length of the encoded sequence
    };
    public async Task<string> GenerateSequence()
    {
        // Look for an existing Sequence record
        var sequence = new Sequence(typeof(T).Name);
        dbContext.Sequences.Add(sequence);
        await dbContext.SaveChangesAsync();

        var sqidsEncoder = new SqidsEncoder<long>(options);
        var encodedValue = sqidsEncoder.Encode(sequence.CurrentValue);

        return encodedValue;
    }
}
