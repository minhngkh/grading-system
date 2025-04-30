using AssignmentFlow.Application.Shared;

namespace AssignmentFlow.Application.Gradings;

public static class ValueObjectExtensions
{
    public static List<CriterionAttachmentsSelector> ToCriterionAttachmentsSelectors(this List<CriterionAttachmentsSelectorApiContract> apiContract)
        => apiContract.ConvertAll(x => x.ToCriterionAttachmentsSelector());

    public static CriterionAttachmentsSelector ToCriterionAttachmentsSelector(this CriterionAttachmentsSelectorApiContract apiContract)
        => CriterionAttachmentsSelector.New(
            CriterionName.New(apiContract.Criterion),
            apiContract.Selector.ToContentSelector());

    public static ContentSelector ToContentSelector(this ContentSelectorApiContract apiContract)
        => ContentSelector.New(apiContract.Pattern, apiContract.Strategy);
}
