﻿using EventFlow.ValueObjects;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AssignmentFlow.Application.Gradings;

[JsonConverter(typeof(SelectorConverter))]
public sealed class Selector : ValueObject
{
    public CriterionName Criterion { get; }
    public Pattern Pattern { get; }
    private Selector(CriterionName criterion, Pattern pattern)
    {
        Criterion = criterion;
        Pattern = pattern;
    }
    public static Selector New(CriterionName criterion, Pattern pattern) => new(criterion, pattern);
}

public class SelectorConverter : JsonConverter<Selector>
{
    public override Selector? ReadJson(JsonReader reader, Type objectType, Selector? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        if (reader.TokenType == JsonToken.Null)
            return null;
        var jObject = JObject.Load(reader);
        var criterion = jObject.GetRequired<CriterionName>("Criterion");
        var pattern = jObject.GetRequired<Pattern>("Pattern");

        return Selector.New(criterion, pattern);
    }
    
    public override bool CanWrite => false;

    public override void WriteJson(JsonWriter writer, Selector? value, JsonSerializer serializer)
        => throw new NotSupportedException();
}