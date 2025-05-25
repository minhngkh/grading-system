using EventFlow.Sagas;

namespace AssignmentFlow.Application.Gradings;

public class GradingSagaId(string id) : ISagaId
{
    public string Value => id;
}
