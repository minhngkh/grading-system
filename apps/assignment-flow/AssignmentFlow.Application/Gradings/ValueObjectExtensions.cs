namespace AssignmentFlow.Application.Gradings;

public static class ValueObjectExtensions
{
    public static List<CriteriaFilesMapping> ToCriteriaFilesMappings(this List<CriteriaFilesMappingApiContract> apiContract)
        => apiContract.ConvertAll(x => x.ToCriteriaFilesMapping());

    public static CriteriaFilesMapping ToCriteriaFilesMapping(this CriteriaFilesMappingApiContract apiContract)
        => CriteriaFilesMapping.New(
            apiContract.CriterionIdentity.ToCriterionIdentity(),
            apiContract.ContentSelector.ToContentSelector());

    public static CriterionIdentity ToCriterionIdentity(this CriterionIdentityApiContract apiContract)
        => CriterionIdentity.New(apiContract.RubricId, apiContract.CriterionName);

    public static ContentSelector ToContentSelector(this ContentSelectorApiContract apiContract)
        => ContentSelector.New(apiContract.Pattern, apiContract.Strategy);
}
