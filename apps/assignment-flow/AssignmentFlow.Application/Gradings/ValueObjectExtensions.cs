namespace AssignmentFlow.Application.Gradings;

public static class ValueObjectExtensions
{
    public static Selector ToValueObject(this SelectorApiContract apiContract)
    => Selector.New(
            CriterionName.New(apiContract.Criterion),
            Pattern.New(apiContract.Pattern));
}
