using EventFlow.Sagas;

namespace AssignmentFlow.Application.Gradings.Start;

public class GradingSagaId(string id) : ISagaId
{
    public string Value => id;
}
