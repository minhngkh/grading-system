using EventFlow.Sagas;

namespace AssignmentFlow.Application.GradingSaga;

public class GradingSagaId(string id) : ISagaId
{
    public string Value => id;
}
