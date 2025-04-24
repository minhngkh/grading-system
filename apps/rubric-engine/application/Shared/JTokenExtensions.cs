using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace RubricEngine.Application.Shared;

internal static class JTokenExtensions
{
    public static TValue GetRequired<TValue>(this JToken jToken, string propertyPath, string? errorMessageWhenNull = null)
    {
        var currentToken = jToken;

        var propertyParts = propertyPath.Split('.');
        for (var index = 0; index < propertyParts.Length; index++)
        {
            var property = propertyParts[index];
            currentToken = currentToken?[property];

            if (currentToken is null)
                throw new JsonSerializationException($"Missing required property '{propertyPath}'.");

            if (currentToken.Type == JTokenType.Null)
            {
                var currentPropertyPath = string.Join('.', propertyParts[..(index + 1)]);
                throw new JsonSerializationException(errorMessageWhenNull ?? $"Property '{propertyPath}' should not be null.");
            }
        }

        return currentToken.ToObject<TValue>() ?? throw new JsonSerializationException(errorMessageWhenNull ?? $"Property '{propertyPath}' should not be null.");
    }

    public static TValue? Get<TValue>(this JToken jToken, string propertyPath, TValue? defaultValue = default)
    {
        var currentToken = jToken;

        foreach(var property in propertyPath.Split('.'))
        {
            currentToken = currentToken?[property];

            if (currentToken is null || currentToken.Type == JTokenType.Null)
                return defaultValue;
        }

        return currentToken.ToObject<TValue>() ?? defaultValue;
    }
}
