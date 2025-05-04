using EventFlow.Exceptions;
using EventFlow.Extensions;
using EventFlow.Specifications;

namespace AssignmentFlow.Application.Shared;

public static class SpecificationExtensions
{
    public static void ThrowDomainErrorIfNotSatisfied<T>(this ISpecification<T> specification, T aggregateState)
    {
        ArgumentNullException.ThrowIfNull(specification);

        var reasons = specification.WhyIsNotSatisfiedBy(aggregateState).ToList();
        if (reasons.Count != 0)
        {
            throw DomainError.With(
                $"'{specification.GetType().PrettyPrint()}' is not satisfied because {string.Join(" and ", reasons)}.");
        }
    }
}
