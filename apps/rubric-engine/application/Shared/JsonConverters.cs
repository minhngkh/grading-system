using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace RubricEngine.Application.Shared;

public abstract class SingleValueObjectConverter<TValueObject, TValue>(Func<TValue, TValueObject> factoryMethod) : JsonConverter<TValueObject>
    where TValueObject : SingleValueObject<TValue>
    where TValue : class, IComparable
{
    public override bool CanRead => true;
    public override bool CanWrite => false;

    public virtual NullValueHandling NullValueHandling { get; } = NullValueHandling.ThrowException;

    public override TValueObject? ReadJson(JsonReader reader, Type objectType, TValueObject? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;

        var jObject = JObject.Load(reader);

        var value = jObject.Get<TValue>("Value");

        if (value is null)
        {
            return NullValueHandling == NullValueHandling.ThrowException ?
                throw new JsonSerializationException($"Missing required property 'Value'.")
                : null;
        }

        return factoryMethod(value);
    }
}

public enum NullValueHandling : byte
{
    ReturnNull = 0,
    ThrowException = 1
}

public abstract class StringValueObjectConverter<T>(Func<string, T> factoryMethod) : SingleValueObjectConverter<T, string>(factoryMethod)
    where T : StringValueObject;